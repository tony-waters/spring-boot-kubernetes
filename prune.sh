docker ps -q | xargs -r docker stop
docker system prune --volumes -f

