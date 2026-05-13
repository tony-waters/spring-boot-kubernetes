

is this:

```shell
helm install springapp ./helm/springapp
```
 different from this:

```shell
cd helm/springapp
helm install springapp .
```

## tests

curl -v http://172.18.0.3:80/pgadmin

curl -v -H "Host: application" http://172.18.0.3:80/api/customers


## troubleshooting using curltest

kubectl run -n application curltest --rm -it --restart=Never   --image=curlimages/curl --   curl -v http://spring-boot-app:80/actuator/health

kubectl run -n application curlroot --rm -it --restart=Never   --image=curlimages/curl --   curl -v http://spring-boot-app:80


## prometheus community version

kube-prometheus-stack has been installed. Check its status by running:
kubectl --namespace default get pods -l "release=prometheus"

Get Grafana 'admin' user password by running:

kubectl --namespace default get secrets prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo

Access Grafana local instance:

export POD_NAME=$(kubectl --namespace default get pod -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=prometheus" -oname)
kubectl --namespace default port-forward $POD_NAME 3000

Get your grafana admin user password by running:

kubectl get secret --namespace default -l app.kubernetes.io/component=admin-secret -o jsonpath="{.items[0].data.admin-password}" | base64 --decode ; echo


Visit https://github.com/prometheus-operator/kube-prometheus for instructions on how to create & configure Alertmanager and Prometheus instances using the Operator.


