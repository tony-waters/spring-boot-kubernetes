
kind create cluster --image kindest/node:v1.33.4
#cd terraform && terraform apply -var-file=terraform.tfvars.example -auto-approve
#
#cd ../seed && ./run-seed.sh
#

#VERSION="$(basename "$(curl -s -L -o /dev/null -w '%{url_effective}' https://github.com/kubernetes-sigs/cloud-provider-kind/releases/latest)")"

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


#cd helm
#helm dependency build
#helm install springapp .
#cd ..

