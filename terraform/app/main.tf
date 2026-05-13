resource "kubernetes_namespace" "application" {
  metadata {
    name = "application"

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "spring-boot-app-demo"
    }
  }
}

resource "helm_release" "springapp" {
  name       = "springapp"
  namespace  = "application"
  create_namespace = false

  chart      = "${path.module}/../../helm/springapp"

  values = [
    yamlencode({
      logging = "INFO"
    })
  ]

  # --- behaviour ---
  wait            = true
  timeout         = 300
  atomic          = false
  cleanup_on_fail = false

  depends_on = [kubernetes_namespace.application]
}

resource "helm_release" "springseed" {
  name       = "springseed"
  namespace  = "application"
  create_namespace = false

  chart      = "${path.module}/../../helm/springseed"

  # --- behaviour ---
  wait            = true
  timeout         = 300
  atomic          = false
  cleanup_on_fail = false

  depends_on = [kubernetes_namespace.application, helm_release.springapp]
}