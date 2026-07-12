output "db_endpoint" {
  value       = aws_db_instance.mudar_db.endpoint
  description = "The connection endpoint for the RDS instance"
}

output "db_address" {
  value       = aws_db_instance.mudar_db.address
  description = "The address of the RDS instance"
}

output "ecs_security_group_id" {
  value       = aws_security_group.ecs_sg.id
  description = "The ID of the security group assigned to ECS tasks"
}

output "vpc_id" {
  value       = aws_vpc.mudar_vpc.id
  description = "The ID of the VPC"
}

output "private_subnets" {
  value       = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
  description = "List of IDs of private subnets"
}

output "public_subnets" {
  value       = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
  description = "List of IDs of public subnets"
}
