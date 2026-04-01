import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Set a customer ID that you know exists in your seeded/demo data.
const CUSTOMER_ID = __ENV.CUSTOMER_ID || '1';

export const options = {
    scenarios: {
        customer_list: {
            executor: 'constant-arrival-rate',
            rate: 250,           // iterations per second
            timeUnit: '1s',
            duration: '2m',
            preAllocatedVUs: 100,
            maxVUs: 200,
            tags: { scenario: 'customer_list' },
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.01'],
        'http_req_duration{scenario:customer_list}': ['p(95)<500'],
    },
};

export default function () {
    const requests = [
        {
            name: 'customers_page',
            url: `${BASE_URL}/api/customers?page=0&size=20`,
        },
        {
            name: 'customers_filtered',
            url: `${BASE_URL}/api/customers?name=ton&page=0&size=20`,
        },
        {
            name: 'tickets_by_status',
            url: `${BASE_URL}/api/customers/${CUSTOMER_ID}/tickets?status=OPEN`,
        },
    ];

    const picked = requests[Math.floor(Math.random() * requests.length)];

    const res = http.get(picked.url, {
        tags: {
            endpoint: picked.name,
        },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'body is not empty': (r) => r.body && r.body.length > 0,
    });

    sleep(0.2);
}