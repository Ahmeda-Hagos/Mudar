variable "environment" {
  type        = string
  description = "Environment name"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID from RDS module"
}

variable "private_subnets" {
  type        = list(string)
  description = "Private Subnet IDs"
}

variable "public_subnets" {
  type        = list(string)
  description = "Public Subnet IDs"
}

variable "ecs_security_group_id" {
  type        = string
  description = "Security Group ID for ECS Tasks"
}

variable "db_endpoint" {
  type        = string
  description = "RDS connection endpoint"
}

variable "db_password" {
  type        = string
  description = "RDS master password"
  sensitive   = true
}

variable "jwt_secret" {
  type        = string
  description = "JWT Secret"
  sensitive   = true
}

variable "kms_key_arn" {
  type        = string
  description = "KMS Key ARN for S3 encryption"
}
