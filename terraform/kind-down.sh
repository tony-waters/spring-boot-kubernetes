terraform -chdir=kind destroy -auto-approve

echo "Cleaning up Docker ..."
./down-docker.sh
