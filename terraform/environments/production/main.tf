terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Note: For production use, uncomment and configure the S3 backend
  # backend "s3" {
  #   bucket = "visaflow-terraform-state"
  #   key    = "production/terraform.tfstate"
  #   region = "eu-central-1"
  # }
}

provider "aws" {
  region = "eu-central-1"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "kms_key_arn" {
  type = string
}

module "rds" {
  source = "../../modules/rds"

  environment       = "production"
  region            = "eu-central-1"
  multi_az          = true # Production uses Multi-AZ for high availability
  db_instance_class = "db.t3.medium" # Slightly larger for prod
  db_password       = var.db_password
  kms_key_arn       = var.kms_key_arn
}

module "ecs" {
  source = "../../modules/ecs"

  environment           = "production"
  vpc_id                = module.rds.vpc_id
  private_subnets       = module.rds.private_subnets
  public_subnets        = module.rds.public_subnets
  ecs_security_group_id = module.rds.ecs_security_group_id
  db_endpoint           = module.rds.db_endpoint
  db_password           = var.db_password
  jwt_secret            = var.jwt_secret
  kms_key_arn           = var.kms_key_arn
}

output "production_api_url" {
  value = "http://${module.ecs.alb_dns_name}"
}
