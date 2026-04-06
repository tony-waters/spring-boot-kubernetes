#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-spring-boot-app-demo}"
JOB_NAME="spring-boot-app-seed"
MANIFEST="./seed-job.yaml"

echo "Using namespace: $NAMESPACE"

if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
  echo "Namespace '$NAMESPACE' does not exist"
  exit 1
fi

echo "Deleting any previous seed job..."
kubectl delete job "$JOB_NAME" -n "$NAMESPACE" --ignore-not-found=true

echo "Applying seed job manifest..."
kubectl apply -n "$NAMESPACE" -f "$MANIFEST"

echo "Waiting for pod to be created..."
kubectl wait --for=jsonpath='{.status.ready}'=false pod -l job-name="$JOB_NAME" -n "$NAMESPACE" --timeout=60s >/dev/null 2>&1 || true

echo "Waiting for job completion..."
if kubectl wait --for=condition=complete "job/$JOB_NAME" -n "$NAMESPACE" --timeout=600s; then
  echo
  echo "Seed job completed successfully. Logs:"
  kubectl logs -n "$NAMESPACE" "job/$JOB_NAME"
else
  echo
  echo "Seed job failed or timed out. Describing job and showing logs..."
  kubectl describe job "$JOB_NAME" -n "$NAMESPACE" || true
  kubectl get pods -n "$NAMESPACE" -l job-name="$JOB_NAME" || true
  kubectl logs -n "$NAMESPACE" "job/$JOB_NAME" --all-containers=true || true
  exit 1
fi