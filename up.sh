
cd terraform
source kind create cluster
terraform apply -var-file=terraform.tfvars.example -auto-approve
cd ..

kubectl apply -f helm/spring-boot-app-seed/seed-job.yaml
#kubectl logs spring-boot-app-seed -n spring-boot-app-demo
#watch kubectl get po -A

# smoke test
kubectl port-forward -n spring-boot-app-demo svc/spring-boot-app-spring-boot-app 8080:80
curl -v http://localhost:8080/actuator/health
curl -v http://localhost:8080/actuator/health/readiness
