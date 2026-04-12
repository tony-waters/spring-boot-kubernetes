
kind create cluster --image kindest/node:v1.33.4

cd terraform && terraform apply -var-file=terraform.tfvars.example -auto-approve

cd ../seed && ./run-seed.sh

