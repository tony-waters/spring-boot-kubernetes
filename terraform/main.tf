
resource "kubernetes_namespace" "app" {
  metadata {
    name = var.namespace

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "spring-boot-app-demo"
    }
  }
}

resource "helm_release" "spring_boot_app" {
  name             = var.release_name
  namespace        = kubernetes_namespace.app.metadata[0].name
  create_namespace = false

  chart = "${path.module}/../helm"

  atomic          = true
  cleanup_on_fail = true
  wait            = true
  timeout         = 300

  values = [
    yamlencode({
      replicaCount = var.replica_count

      image = {
        repository = var.image_repository
        tag        = var.image_tag
        pullPolicy = "IfNotPresent"
      }

      service = {
        type       = var.service_type
        port       = 80
        targetPort = 8080
      }

      app = {
        javaOpts            = "-Xms256m -Xmx512m"
        springProfilesActive = "default"
      }

      config = {
        serverPort                           = "8080"
        managementEndpointsWebExposureInclude = "health,info"
        managementEndpointHealthProbesEnabled = "true"
      }

      resources = {
        requests = {
          cpu    = "250m"
          memory = "512Mi"
        }
        limits = {
          cpu    = "500m"
          memory = "1Gi"
        }
      }

      autoscaling = {
        enabled                        = var.autoscaling_enabled
        minReplicas                    = var.autoscaling_min_replicas
        maxReplicas                    = var.autoscaling_max_replicas
        targetCPUUtilizationPercentage = var.autoscaling_target_cpu
      }

      ingress = {
        enabled   = var.ingress_enabled
        className = var.ingress_class_name
        annotations = {}
        hosts = [
          {
            host = var.host
            paths = [
              {
                path     = "/"
                pathType = "Prefix"
              }
            ]
          }
        ]
        tls = []
      }
    })
  ]

  depends_on = [kubernetes_namespace.app]
}