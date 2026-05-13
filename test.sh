
k6 run \
  -e TEST_PROFILE=smoke \
  -e BASE_URL=http://172.18.0.4 \
  -e HOST_HEADER=application \
  ./k6/write-test.js