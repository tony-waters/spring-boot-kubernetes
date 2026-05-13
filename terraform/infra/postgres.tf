resource "kubernetes_namespace" "postgres" {
  metadata {
    name = "postgres"

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "spring-boot-app-demo"
    }
  }
}

resource "helm_release" "postgres" {
  name       = "postgres"
  namespace  = kubernetes_namespace.prometheus.metadata[0].name
  create_namespace = false

  chart      = "${path.module}/../../helm-infra/postgres"

  # --- behaviour ---
  wait            = true
  timeout         = 300
  atomic          = false
  cleanup_on_fail = false

  depends_on = [kubernetes_namespace.postgres]
}
