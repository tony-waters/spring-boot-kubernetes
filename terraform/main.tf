resource "kubernetes_namespace" "app" {
  metadata {
    name = var.namespace

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "spring-boot-app-demo"
    }
  }
}

resource "helm_release" "postgres" {
  name             = var.postgres_release_name
  namespace        = kubernetes_namespace.app.metadata[0].name
  create_namespace = false

  chart = "${path.module}/../helm/postgres"

  atomic          = false
  cleanup_on_fail = false
  wait            = true
  timeout         = 300

  values = [
    yamlencode({
      image = {
        repository = "postgres"
        tag        = "16.2"
        pullPolicy = "IfNotPresent"
      }

      database = {
        mode = "internal"

        internal = {
          enabled          = true
          serviceName      = var.db_service_name
          port             = var.db_port
          dbName           = var.db_name
          username         = var.db_username
          password         = var.db_password
          existingSecret   = ""
          secretName       = var.db_secret_name
          storageClassName = var.db_storage_class_name
          storageSize      = var.db_storage_size
          resources = {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }

        external = {
          host           = ""
          port           = 5432
          dbName         = ""
          existingSecret = ""
          usernameKey    = "username"
          passwordKey    = "password"
          dbNameKey      = "database"
        }
      }
    })
  ]

  depends_on = [kubernetes_namespace.app]
}

resource "helm_release" "spring_boot_app" {
  name             = var.release_name
  namespace        = kubernetes_namespace.app.metadata[0].name
  create_namespace = false

  chart = "${path.module}/../helm/spring-boot-app"

  atomic          = false
  cleanup_on_fail = false
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

      probes = {
        liveness = {
          path                = "/actuator/health/liveness"
          initialDelaySeconds = 30
          periodSeconds       = 10
          timeoutSeconds      = 2
          failureThreshold    = 3
        }
        readiness = {
          path                = "/actuator/health/readiness"
          initialDelaySeconds = 20
          periodSeconds       = 10
          timeoutSeconds      = 2
          failureThreshold    = 3
        }
      }

      app = {
        javaOpts             = "-Xms256m -Xmx512m"
        springProfilesActive = "default"
      }

      config = {
        serverPort                            = "8080"
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

      seedJob = {
        # enabled                 = var.seed_job_enabled
        enabled                 = true
        springProfile           = "seed"
        backoffLimit            = 0
        ttlSecondsAfterFinished = 300
        resources = {
          requests = {
            cpu    = "100m"
            memory = "256Mi"
          }
          limits = {
            cpu    = "250m"
            memory = "512Mi"
          }
        }
      }

      ingress = {
        enabled     = var.ingress_enabled
        className   = var.ingress_class_name
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

      database = {
        host           = var.db_service_name
        port           = var.db_port
        name           = var.db_name
        existingSecret = var.db_secret_name
        usernameKey    = "postgres-user"
        passwordKey    = "postgres-password"
        ddlAuto        = var.db_ddl_auto
      }
    })
  ]

  depends_on = [
    kubernetes_namespace.app,
    helm_release.postgres
  ]
}