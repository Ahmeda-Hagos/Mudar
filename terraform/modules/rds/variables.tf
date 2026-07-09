variable "environment" {
  type        = string
  description = "Environment name (e.g., staging, production)"
}

variable "region" {
  type        = string
  description = "AWS Region"
  default     = "me-central-2"
}

variable "kms_key_arn" {
  type        = string
  description = "ARN of the existing KMS key to use for RDS encryption"
}

variable "multi_az" {
  type        = bool
  description = "Enable Multi-AZ deployment for RDS"
  default     = false
}

variable "db_instance_class" {
  type        = string
  description = "Instance type for RDS"
  default     = "db.t3.micro"
}

variable "db_password" {
  type        = string
  description = "Master password for RDS"
  sensitive   = true
}
