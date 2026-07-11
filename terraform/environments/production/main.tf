terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "visaflow-tf-burner-state-49172"
    key    = "production-v2/terraform.tfstate"
    region = "eu-central-1"
  }
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

  environment       = "production-v2"
  region            = "eu-central-1"
  multi_az          = true # Production uses Multi-AZ for high availability
  db_instance_class = "db.t3.medium" # Slightly larger for prod
  db_password       = var.db_password
  kms_key_arn       = var.kms_key_arn
}

module "ecs" {
  source = "../../modules/ecs"

  environment           = "production-v2"
  region                = "eu-central-1"
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

output "production_ecr_repository_url" {
  value = module.ecs.ecr_repository_url
}
