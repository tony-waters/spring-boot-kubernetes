output "namespace" {
  description = "Application namespace"
  value       = kubernetes_namespace.app.metadata[0].name
}

output "helm_release_name" {
  description = "Helm release name"
  value       = helm_release.spring_boot_app.name
}

output "helm_release_status" {
  description = "Helm release status"
  value       = helm_release.spring_boot_app.status
}