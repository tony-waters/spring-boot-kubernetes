resource "kind_cluster" "default" {
    name = "springapp-cluster"

    node {
        role = "control-plane"
    }

    node {
        role = "worker"
    }

    node {
        role = "worker"
    }
}

resource "terraform_data" "cloud_provider_kind" {
    triggers_replace = [
        kind_cluster.default.name
    ]

    provisioner "local-exec" {
        interpreter = ["/bin/bash", "-c"]
        command = <<-EOT
      set -euo pipefail

      echo "Removing any existing cloud-provider-kind container..."
      docker rm -f cloud-provider-kind >/dev/null 2>&1 || true

      echo "Starting cloud-provider-kind..."
      docker run -d \
        --name cloud-provider-kind \
        --rm \
        --network host \
        -v /var/run/docker.sock:/var/run/docker.sock \
        registry.k8s.io/cloud-provider-kind/cloud-controller-manager:v0.10.0
    EOT
    }

    provisioner "local-exec" {
        when        = destroy
        interpreter = ["/bin/bash", "-c"]
        command = <<-EOT
      set -euo pipefail

      echo "Stopping cloud-provider-kind..."
      docker rm -f cloud-provider-kind >/dev/null 2>&1 || true
    EOT
    }

    depends_on = [kind_cluster.default]
}