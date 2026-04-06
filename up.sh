
kind create cluster
cd terraform && terraform apply -var-file=terraform.tfvars.example -auto-approve

cd ../seed && ./run-seed.sh

