
cd terraform
source kind delete cluster
terraform destroy -var-file=terraform.tfvars.example -auto-approve
cd ..