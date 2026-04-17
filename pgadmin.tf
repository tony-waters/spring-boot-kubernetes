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
  name             = "pgadmin"
  namespace        = kubernetes_namespace.pgadmin.metadata[0].name
  repository       = "https://helm.runix.net"
  # chart            = "pgadmin4"
  chart = "${path.module}/../../helm-infra/pgadmin"
  create_namespace = false

  wait            = true
  timeout         = 300
  atomic          = false
  cleanup_on_fail = false

  values = [
    file("${path.module}/pgadmin-values.yaml")
  ]

  depends_on = [kubernetes_namespace.pgadmin]
}

resource "kubectl_manifest" "pgadmin_route" {
  yaml_body = <<YAML
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: pgadmin
  namespace: pgadmin
spec:
  parentRefs:
    - group: gateway.networking.k8s.io
      kind: Gateway
      name: gateway
      namespace: gateway
  rules:
    - backendRefs:
        - group: ""
          kind: Service
          name: pgadmin
          port: 80
      matches:
        - path:
            type: PathPrefix
            value: /
YAML

  depends_on = [helm_release.pgadmin]
}


# resource "kubernetes_namespace" "pgadmin" {
#   metadata {
#     name = "pgadmin"
#
#     labels = {
#       "app.kubernetes.io/managed-by" = "terraform"
#       "app.kubernetes.io/part-of"    = "spring-boot-app-demo"
#     }
#   }
# }
#
# resource "helm_release" "pgadmin" {
#   name             = "pgadmin"
#   namespace        = kubernetes_namespace.pgadmin.metadata[0].name
#   repository       = "https://helm.runix.net"
#   chart            = "pgadmin4"
#   create_namespace = false
#
#   wait            = true
#   timeout         = 300
#   atomic          = false
#   cleanup_on_fail = false
#
#   values = [
#     file("${path.module}/pgadmin-values.yaml")
#   ]
#
#   depends_on = [kubernetes_namespace.pgadmin]
# }
#
# resource "kubectl_manifest" "test" {
#   yaml_body = <<YAML
# apiVersion: gateway.networking.k8s.io/v1
# kind: HTTPRoute
# metadata:
#   name: pgadmin
#   namespace: pgadmin
# spec:
#   parentRefs:
#     - group: gateway.networking.k8s.io
#       kind: Gateway
#       name: gateway
#       namespace: gateway
#   rules:
#     - backendRefs:
#         - group: ""
#           kind: Service
#           name: pgadmin
#           port: 80
#       matches:
#         - path:
#             type: PathPrefix
#             value: /
# YAML
#
#   depends_on = [helm_release.pgadmin]
# }