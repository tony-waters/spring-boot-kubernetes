
# https://istio.io/latest/docs/ambient/install/helm/

# Prerequisites
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# Base components
helm install istio-base istio/base -n istio-system --create-namespace --wait

# Install or upgrade the Kubernetes Gateway API CRDs
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
  kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.0/experimental-install.yaml

# istiod control plane
helm install istiod istio/istiod --namespace istio-system --set profile=ambient --wait

# CNI node agent
helm install istio-cni istio/cni -n istio-system --set profile=ambient --wait

# ztunnel DaemonSet
helm install ztunnel istio/ztunnel -n istio-system --wait

# Ingress gateway (optional)
helm install istio-ingress istio/gateway -n istio-ingress --create-namespace --wait


