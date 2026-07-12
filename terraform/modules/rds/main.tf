# ---------------------------------------------------------
# VPC & Subnets (Private Only for Database)
# ---------------------------------------------------------

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "mudar_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "mudar-vpc-${var.environment}"
  }
}

# Two private subnets for RDS and ECS Tasks
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.mudar_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]
  tags = { Name = "mudar-private-subnet-1-${var.environment}" }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.mudar_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
  tags = { Name = "mudar-private-subnet-2-${var.environment}" }
}

# Two public subnets for ALB and NAT Gateway
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.mudar_vpc.id
  cidr_block              = "10.0.101.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags = { Name = "mudar-public-subnet-1-${var.environment}" }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.mudar_vpc.id
  cidr_block              = "10.0.102.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  tags = { Name = "mudar-public-subnet-2-${var.environment}" }
}

# Internet Gateway for Public Subnets
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.mudar_vpc.id
  tags = { Name = "mudar-igw-${var.environment}" }
}

# Public Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.mudar_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "mudar-public-rt-${var.environment}" }
}

resource "aws_route_table_association" "public_rta_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# NAT Gateway for Private Subnets Outbound Access (e.g. to ECR / SSM)
resource "aws_eip" "nat_eip" {
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet_1.id
  depends_on    = [aws_internet_gateway.igw]
  tags = { Name = "mudar-nat-${var.environment}" }
}

# Private Route Table
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.mudar_vpc.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = { Name = "mudar-private-rt-${var.environment}" }
}

resource "aws_route_table_association" "private_rta_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_rta_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "mudar-rds-subnets-${var.environment}"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

# ---------------------------------------------------------
# Security Groups
# ---------------------------------------------------------

resource "aws_security_group" "ecs_sg" {
  name        = "mudar-ecs-sg-${var.environment}"
  description = "Security group for ECS Tasks"
  vpc_id      = aws_vpc.mudar_vpc.id

  # Egress to internet for API outbound calls (needs NAT gateway in a real scenario, or VPC endpoints)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "mudar-rds-sg-${var.environment}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.mudar_vpc.id

  # Allow ingress ONLY from the ECS security group on port 5432
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ---------------------------------------------------------
# Parameter Group (Force SSL)
# ---------------------------------------------------------

resource "aws_db_parameter_group" "postgres_15" {
  name   = "mudar-pg15-${var.environment}"
  family = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

# ---------------------------------------------------------
# RDS Instance
# ---------------------------------------------------------

resource "aws_db_instance" "mudar_db" {
  identifier                  = "mudar-db-${var.environment}"
  engine                      = "postgres"
  engine_version              = "15"
  instance_class              = var.db_instance_class
  allocated_storage           = 20
  max_allocated_storage       = 100
  storage_type                = "gp3"

  db_name                     = "mudar"
  username                    = "postgres"
  password                    = var.db_password

  db_subnet_group_name        = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids      = [aws_security_group.rds_sg.id]
  parameter_group_name        = aws_db_parameter_group.postgres_15.name

  # Hardening Constraints
  publicly_accessible         = false
  storage_encrypted           = true
  kms_key_id                  = var.kms_key_arn
  multi_az                    = var.multi_az
  deletion_protection         = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "mudar-db-${var.environment}-final"
  
  # Data Residency Lock: Ensure automated backups stay in region
  backup_retention_period     = 7
  backup_window               = "02:00-03:00"
  maintenance_window          = "sun:04:00-sun:05:00"

  lifecycle {
    prevent_destroy = true
  }
}
