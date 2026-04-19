resource "kubernetes_namespace" "prometheus" {
  metadata {
    name = "prometheus"

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "spring-boot-app-demo"
    }
  }
}

resource "helm_release" "prometheus" {
  name       = "prometheus"
  namespace  = kubernetes_namespace.prometheus.metadata[0].name
  create_namespace = false

  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "83.4.2"

  # --- behaviour ---
  wait            = true
  timeout         = 300
  atomic          = false
  cleanup_on_fail = false

  values = [
    yamlencode({
      crds = {
        enabled = true
      }

      alertmanager = {
        enabled = false
      }

      grafana = {
        enabled = true
        adminPassword = "admin"
        service = {
          type = "ClusterIP"
          port = 80
        }
        "grafana.ini" = {
          server = {
            root_url            = "http://localhost/grafana"
            serve_from_sub_path = true
          }
        }
        route = {
          main = {
            enabled    = true
            apiVersion = "gateway.networking.k8s.io/v1"
            kind       = "HTTPRoute"
            parentRefs = [
              {
                name        = "application-gateway"
                namespace   = "application-gateway"
                sectionName = "default"
              }
            ]
            matches = [
              {
                path = {
                  type  = "PathPrefix"
                  value = "/grafana"
                }
              }
            ]
          }
        }
      }

      prometheus = {
        prometheusSpec = {
          retention = "1d"
          resources = {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
          }
        }
      }
    })
  ]
  depends_on = [kubernetes_namespace.prometheus]
}
