# How to use it

## From deployment/terraform:

Once you have a kubernetes environment running:

```bash
terraform init
terraform plan -var-file=terraform.tfvars.example
terraform apply -var-file=terraform.tfvars.example
```

Then verify with:

```bash
kubectl get ns
kubectl get pods -n spring-jpa-demo
kubectl get svc -n spring-jpa-demo
helm list -n spring-jpa-demo
```

Terraform’s Kubernetes tutorial covers using the Kubernetes provider 
to manage cluster resources, 
and the Helm tutorial shows deploying charts via Terraform 
rather than running Helm manually.