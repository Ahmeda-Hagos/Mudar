provider "aws" {
  region = "eu-central-1"
}

# KMS Key for S3 Encryption
resource "aws_kms_key" "visaflow_s3_key" {
  description             = "KMS key for encrypting sensitive passport scans"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "visaflow_s3_key_alias" {
  name          = "alias/visaflow-s3"
  target_key_id = aws_kms_key.visaflow_s3_key.key_id
}

# S3 Bucket
resource "aws_s3_bucket" "visaflow_sensitive_vault" {
  bucket = "visaflow-sensitive-vault-prod"
}

# Block Public Access strictly
resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.visaflow_sensitive_vault.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enforce encryption by default
resource "aws_s3_bucket_server_side_encryption_configuration" "kms_encryption" {
  bucket = aws_s3_bucket.visaflow_sensitive_vault.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.visaflow_s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Bucket Policy strictly denying unencrypted uploads (Defense in Depth)
resource "aws_s3_bucket_policy" "require_kms" {
  bucket = aws_s3_bucket.visaflow_sensitive_vault.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyIncorrectEncryptionHeader"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.visaflow_sensitive_vault.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.visaflow_sensitive_vault.arn}/*"
        Condition = {
          Null = {
            "s3:x-amz-server-side-encryption" = "true"
          }
        }
      }
    ]
  })
}
