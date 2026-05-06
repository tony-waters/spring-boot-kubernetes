
kind create cluster --image kindest/node:v1.33.4

docker rm -f cloud-provider-kind 2>/dev/null || true
docker run -d \
  --name cloud-provider-kind \
  --rm \
  --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  registry.k8s.io/cloud-provider-kind/cloud-controller-manager:v0.10.0

sleep 2

kubectl get gatewayclass
kubectl get crd | grep gateway.networking.k8s.io

helm dependency build ./helm-infra
helm install infra ./helm-infra
helm dependency build ./helm/springapp
helm upgrade --install springapp ./helm/springapp


