helm dependency build ./helm-infra
helm install infra ./helm-infra
helm dependency build ./helm/springapp
helm upgrade --install springapp ./helm/springapp
