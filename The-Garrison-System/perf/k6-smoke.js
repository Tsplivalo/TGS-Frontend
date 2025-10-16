import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:4200/');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'served fast': (r) => r.timings.duration < 800,
  });
  sleep(1);
}


