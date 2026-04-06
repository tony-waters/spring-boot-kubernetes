
cd terraform && terraform destroy -var-file=terraform.tfvars.example -auto-approve
kind delete cluster
