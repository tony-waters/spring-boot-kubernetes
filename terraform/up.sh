terraform -chdir=kind init
terraform -chdir=kind apply -auto-approve
sleep 30

terraform -chdir=infra init
terraform -chdir=infra apply -auto-approve

terraform -chdir=app init
terraform -chdir=app apply -auto-approve