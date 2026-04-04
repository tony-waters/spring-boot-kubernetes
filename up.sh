
cd terraform
source kind create cluster
terraform apply -var-file=terraform.tfvars.example -auto-approve
cd ..

kubectl apply -f helm/spring-boot-app-seed/seed-job.yaml
#kubectl logs spring-boot-app-seed -n spring-boot-app-demo
#watch kubectl get po -A
