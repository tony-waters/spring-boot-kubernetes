# output "namespace" {
#   description = "Application namespace"
#   value       = kubernetes_namespace.app.metadata[0].name
# }
#
# output "postgres_release_name" {
#   description = "Postgres Helm release name"
#   value       = helm_release.postgres.name
# }
#
# output "postgres_release_status" {
#   description = "Postgres Helm release status"
#   value       = helm_release.postgres.status
# }
#
# output "helm_release_name" {
#   description = "Application Helm release name"
#   value       = helm_release.spring_boot_app.name
# }
#
# output "helm_release_status" {
#   description = "Application Helm release status"
#   value       = helm_release.spring_boot_app.status
# }