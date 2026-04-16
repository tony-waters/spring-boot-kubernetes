#!/usr/bin/env bash
set -Eeuo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-kind}"
CCM_NAME="${CCM_NAME:-cloud-provider-kind}"
RELEASE_NAME="${RELEASE_NAME:-springapp}"
RELEASE_NAMESPACE="${RELEASE_NAMESPACE:-default}"

echo "==> Uninstalling Helm release (if present)"
helm uninstall "${RELEASE_NAME}" -n "${RELEASE_NAMESPACE}" 2>/dev/null || true

#echo "==> Deleting common app namespaces (if present)"
#kubectl delete namespace application application-gateway postgres pgadmin demo --ignore-not-found=true 2>/dev/null || true

echo "==> Removing cloud-provider-kind container (if present)"
docker rm -f "${CCM_NAME}" 2>/dev/null || true

#echo "==> Removing any gateway envoy containers"
#GW_CONTAINERS="$(docker ps -aq --filter 'name=kindccm-gw-')"
#if [ -n "${GW_CONTAINERS}" ]; then
#  docker rm -f ${GW_CONTAINERS}
#fi

echo "==> Deleting kind cluster '${CLUSTER_NAME}'"
kind delete cluster --name "${CLUSTER_NAME}" 2>/dev/null || true

echo "==> Removing any leftover kind node containers"
KIND_CONTAINERS="$(docker ps -aq --filter "label=io.x-k8s.kind.cluster=${CLUSTER_NAME}")"
if [ -n "${KIND_CONTAINERS}" ]; then
  docker rm -f ${KIND_CONTAINERS}
fi

echo "==> Removing orphaned Docker networks commonly left by kind/gateway"
for net in kind; do
  docker network rm "${net}" 2>/dev/null || true
done

echo "==> Optional stop other containers"
docker ps -q | xargs -r docker stop

echo "==> Optional cleanup of dangling images/volumes"
docker image prune -f >/dev/null 2>&1 || true
docker volume prune -f >/dev/null 2>&1 || true

echo "Reset complete."
