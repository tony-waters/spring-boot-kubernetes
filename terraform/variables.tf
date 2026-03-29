variable "kubeconfig_path" {
  description = "Path to kubeconfig file"
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "Kubernetes context to use"
  type        = string
}

variable "namespace" {
  description = "Namespace for the application"
  type        = string
  default     = "spring-boot-app-demo"
}

variable "release_name" {
  description = "Helm release name"
  type        = string
  default     = "spring-boot-app"
}

variable "image_repository" {
  description = "Container image repository"
  type        = string
  default     = "spring-boot-app"
}

variable "image_tag" {
  description = "Container image tag"
  type        = string
  default     = "latest"
}

variable "replica_count" {
  description = "Number of app replicas"
  type        = number
  default     = 1
}

variable "service_type" {
  description = "Kubernetes Service type"
  type        = string
  default     = "ClusterIP"
}

variable "ingress_enabled" {
  description = "Whether to enable ingress"
  type        = bool
  default     = false
}

variable "ingress_class_name" {
  description = "Ingress class name"
  type        = string
  default     = ""
}

variable "host" {
  description = "Ingress hostname"
  type        = string
  default     = "spring-boot-app.local"
}

variable "autoscaling_enabled" {
  description = "Whether to enable HPA"
  type        = bool
  default     = false
}

variable "autoscaling_min_replicas" {
  description = "Minimum replicas for HPA"
  type        = number
  default     = 1
}

variable "autoscaling_max_replicas" {
  description = "Maximum replicas for HPA"
  type        = number
  default     = 3
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization percentage for HPA"
  type        = number
  default     = 70
}