import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 10 },   // Ramp-up to 10 VUs
    { duration: '20s', target: 10 },  // Sustained moderate load
    { duration: '5s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5144';

export default function () {
  // Test Case: Evaluate API gateway endpoint response under baseline load
  const res = http.get(`${BASE_URL}/swagger/v1/swagger.json`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // 1 second think time between requests
}
