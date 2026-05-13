terraform -chdir=app destroy -auto-approve
terraform -chdir=infra destroy -auto-approve
terraform -chdir=kind destroy -auto-approve

