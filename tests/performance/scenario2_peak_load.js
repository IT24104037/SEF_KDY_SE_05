import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 20 },   // Fast ramp-up to 20 VUs
    { duration: '20s', target: 50 },  // Surge to peak 50 VUs
    { duration: '5s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should complete under 1000ms under high load
    http_req_failed: ['rate<0.05'],    // Under 5% failure rate
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5144';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Scenario 2 Workflow: High concurrency stress test up to 50 VUs
  const res = http.get(`${BASE_URL}/swagger/v1/swagger.json`, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency within bounds': (r) => r.timings.duration < 1000,
  });

  sleep(0.5); // 500ms think time simulating high activity
}
