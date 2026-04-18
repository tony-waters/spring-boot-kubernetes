resource "kubernetes_namespace" "pgadmin" {
  metadata {
    name = "pgadmin"

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "spring-boot-app-demo"
    }
  }
}

resource "helm_release" "pgadmin" {
  name       = "pgadmin"
  namespace  = "pgadmin"
  create_namespace = false

  chart      = "${path.module}/../../helm-infra/pgadmin"

  # --- behaviour ---
  wait            = true
  timeout         = 300
  atomic          = false
  cleanup_on_fail = false

  # --- values ---
  # values = [
  #   file("${path.module}/pgadmin-values.yaml")
  # ]

  depends_on = [kubernetes_namespace.pgadmin]
}
