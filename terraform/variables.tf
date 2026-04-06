variable "kubeconfig_path" {
  description = "Path to kubeconfig file"
  type        = string
}

variable "kube_context" {
  description = "Kubeconfig context to use"
  type        = string
}

variable "namespace" {
  description = "Namespace for the application"
  type        = string
  default     = "spring-boot-app-demo"
}

variable "release_name" {
  description = "Helm release name for the Spring Boot app"
  type        = string
  default     = "spring-boot-app"
}

variable "postgres_release_name" {
  description = "Helm release name for Postgres"
  type        = string
  default     = "postgres"
}

variable "replica_count" {
  description = "Number of app replicas"
  type        = number
  default     = 1
}

variable "image_repository" {
  description = "Application image repository"
  type        = string
  default     = "ghcr.io/tony-waters/spring-boot-app"
}

variable "image_tag" {
  description = "Application image tag"
  type        = string
  default     = "latest"
}

variable "service_type" {
  description = "Kubernetes service type for app"
  type        = string
  default     = "ClusterIP"
}

variable "autoscaling_enabled" {
  description = "Whether autoscaling is enabled"
  type        = bool
  default     = false
}

variable "autoscaling_min_replicas" {
  description = "Minimum HPA replicas"
  type        = number
  default     = 1
}

variable "autoscaling_max_replicas" {
  description = "Maximum HPA replicas"
  type        = number
  default     = 3
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization percentage for HPA"
  type        = number
  default     = 70
}

variable "ingress_enabled" {
  description = "Whether ingress is enabled"
  type        = bool
  default     = false
}

variable "ingress_class_name" {
  description = "Ingress class name"
  type        = string
  default     = ""
}

variable "host" {
  description = "Ingress host"
  type        = string
  default     = "spring-boot-app.local"
}

variable "db_service_name" {
  description = "Postgres service name inside Kubernetes"
  type        = string
  default     = "postgres"
}

variable "db_port" {
  description = "Postgres service port"
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "spring_jpa"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "spring_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_secret_name" {
  description = "Secret name used by Postgres chart and consumed by app chart"
  type        = string
  default     = "postgres-secret"
}

variable "db_storage_size" {
  description = "Persistent volume size for Postgres"
  type        = string
  default     = "5Gi"
}

variable "db_storage_class_name" {
  description = "StorageClass name for Postgres PVC"
  type        = string
  default     = ""
}

variable "db_ddl_auto" {
  description = "Hibernate ddl-auto mode"
  type        = string
  default     = "update"
}