resource "kubernetes_namespace" "application-gateway" {
  metadata {
    name = "application-gateway"

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "spring-boot-app-demo"
    }
  }
}

resource "helm_release" "application-gateway" {
  name       = "gateway"
  # namespace  = "gateway"
  create_namespace = false

  chart      = "${path.module}/../../helm-infra/gateway"

  # --- behaviour ---
  wait            = true
  timeout         = 300
  atomic          = false
  cleanup_on_fail = false

  # --- values ---
  # values = [
  #   file("${path.module}/gateway-values.yaml")
  # ]

  depends_on = [kubernetes_namespace.application-gateway]
}
