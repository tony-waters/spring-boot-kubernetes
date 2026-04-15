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
  repository = "https://helm.runix.net"
  chart      = "pgadmin4"

  create_namespace = true

  # --- behaviour ---
  wait            = true
  timeout         = 300
  atomic          = false
  cleanup_on_fail = false

  # --- values ---
  values = [
    file("./pgadmin-values.yaml")
  ]
}

resource "kubectl_manifest" "test" {
  yaml_body = <<YAML
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: pgadmin
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
          name: pagadmin
          port: 80
      matches:
        - path:
            type: PathPrefix
            value: /
YAML
}


