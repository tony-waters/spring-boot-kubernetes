NOTES:
kube-prometheus-stack has been installed. Check its status by running:
kubectl --namespace default get pods -l "release=prom1"

Get Grafana 'admin' user password by running:

kubectl --namespace default get secrets prom1-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo

Access Grafana local instance:

export POD_NAME=$(kubectl --namespace default get pod -l "app.kubernetes.io/name=grafana,app.kubernetes.io/instance=prom1" -oname)
kubectl --namespace default port-forward $POD_NAME 3000

Get your grafana admin user password by running:

kubectl get secret --namespace default -l app.kubernetes.io/component=admin-secret -o jsonpath="{.items[0].data.admin-password}" | base64 --decode ; echo
