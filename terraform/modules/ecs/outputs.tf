output "alb_dns_name" {
  value       = aws_lb.api_alb.dns_name
  description = "The DNS name of the ALB"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.cluster.name
  description = "The name of the ECS cluster"
}

output "ecs_service_name" {
  value       = aws_ecs_service.api_service.name
  description = "The name of the ECS service"
}

output "migration_task_definition_arn" {
  value       = aws_ecs_task_definition.migration.arn
  description = "ARN of the migration task definition"
}
