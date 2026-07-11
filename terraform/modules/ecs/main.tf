# ---------------------------------------------------------
# IAM Roles & Secrets
# ---------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Store secrets in SSM Parameter Store
resource "aws_ssm_parameter" "database_url" {
  name  = "/visaflow/${var.environment}/database_url"
  type  = "SecureString"
  value = "postgresql://visaflow_app:${var.db_password}@${var.db_endpoint}/visaflow?schema=public"
}

resource "aws_ssm_parameter" "database_url_admin" {
  name  = "/visaflow/${var.environment}/database_url_admin"
  type  = "SecureString"
  value = "postgresql://visaflow_admin:${var.db_password}@${var.db_endpoint}/visaflow?schema=public"
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/visaflow/${var.environment}/jwt_secret"
  type  = "SecureString"
  value = var.jwt_secret
}

# Task Execution Role (used by ECS agent to pull images and read secrets)
resource "aws_iam_role" "ecs_execution_role" {
  name = "visaflow-ecs-exec-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "visaflow-ecs-secrets-${var.environment}"
  role = aws_iam_role.ecs_execution_role.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["ssm:GetParameters"]
      Resource = [
        aws_ssm_parameter.database_url.arn,
        aws_ssm_parameter.database_url_admin.arn,
        aws_ssm_parameter.jwt_secret.arn
      ]
    }]
  })
}

# Task Role (used by the running container)
resource "aws_iam_role" "ecs_task_role" {
  name = "visaflow-ecs-task-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "visaflow-ecs-s3-${var.environment}"
  role = aws_iam_role.ecs_task_role.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetObject"]
        Resource = "arn:aws:s3:::visaflow-sensitive-vault-${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"]
        Resource = "*"
      }
    ]
  })
}

# ---------------------------------------------------------
# ALB & Target Group
# ---------------------------------------------------------

resource "aws_security_group" "alb_sg" {
  name        = "visaflow-alb-sg-${var.environment}"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  security_group_id        = var.ecs_security_group_id
  source_security_group_id = aws_security_group.alb_sg.id
}

resource "aws_lb" "api_alb" {
  name               = "visaflow-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = var.public_subnets
}

resource "aws_lb_target_group" "api_tg" {
  name        = "visaflow-tg-${var.environment}"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/v1/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "api_listener" {
  load_balancer_arn = aws_lb.api_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

# ---------------------------------------------------------
# ECS Cluster & Tasks
# ---------------------------------------------------------

resource "aws_ecs_cluster" "cluster" {
  name = "visaflow-cluster-${var.environment}"
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/ecs/visaflow-api-${var.environment}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "migration_logs" {
  name              = "/ecs/visaflow-migration-${var.environment}"
  retention_in_days = 7
}

resource "aws_ecs_task_definition" "api" {
  family                   = "visaflow-api-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "nginx:latest" # Placeholder, will be replaced by CI/CD
      essential = true
      portMappings = [{
        containerPort = 3000
        hostPort      = 3000
        protocol      = "tcp"
      }]
      secrets = [
        { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
        { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.jwt_secret.arn }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "AWS_REGION", value = var.region },
        { name = "AWS_KMS_KEY_ID", value = var.kms_key_arn }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api_logs.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "migration" {
  family                   = "visaflow-migration-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "migration"
      image     = "nginx:latest" # Placeholder, replaced by CI/CD with a migration command override
      essential = true
      secrets = [
        { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url_admin.arn }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.migration_logs.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "migration"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "api_service" {
  name            = "visaflow-api-service-${var.environment}"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnets
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_tg.arn
    container_name   = "api"
    container_port   = 3000
  }

  lifecycle {
    ignore_changes = [task_definition] # CI/CD will update this
  }
}
