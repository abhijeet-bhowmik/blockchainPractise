docker-compose -f docker-compose.yaml stop
DOCKER_IDS=$(docker-compose -f docker-compose.yaml ps -q)

if [ "$1" == "delete" ]; then
  echo "Deleting containers..."
  docker container rm $DOCKER_IDS
fi