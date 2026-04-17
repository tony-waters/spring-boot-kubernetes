helm dependency build ./helm-infra
helm upgrade --install infra ./helm-infra
helm dependency build ./helm/springapp
helm upgrade --install springapp ./helm/springapp
