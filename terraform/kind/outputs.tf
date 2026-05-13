output "cluster_name" {
  value = kind_cluster.default.name
}

output "kubeconfig" {
  value     = kind_cluster.default.kubeconfig
  sensitive = true
}

output "kubeconfig_path" {
  value = kind_cluster.default.kubeconfig_path
}

output "endpoint" {
  value = kind_cluster.default.endpoint
}