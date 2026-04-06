import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 execution configuration
// - 20 virtual users (concurrent clients)
// - each loops for 1 minute
export const options = {
    vus: 100,
    duration: '1m',
};

// Base URL (allows override via environment variable)
// e.g. k6 run -e BASE_URL=http://my-service customer-test.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {

    // --- STEP 1: Fetch a page of customers ---
    // We randomise the page to avoid hammering page=0 only
    const page = Math.floor(Math.random() * 10);
    const size = 20;

    const listRes = http.get(`${BASE_URL}/api/customers?page=${page}&size=${size}`);

    // Validate that the list endpoint is working
    check(listRes, {
        'list status 200': (r) => r.status === 200,
    });

    // If list call failed, stop this iteration early
    if (listRes.status !== 200) {
        sleep(1);
        return;
    }

    // Parse JSON response body
    const body = listRes.json();

    // Defensive: ensure we have content array
    const customers = body.content || [];

    // Sanity check: did we actually get customers?
    check(listRes, {
        'list has customers': () => customers.length > 0,
    });

    // If empty page, skip rest of iteration
    if (customers.length === 0) {
        sleep(1);
        return;
    }

    // --- STEP 2: Pick a REAL customer ID ---
    // This avoids random-ID guessing
    const chosen = customers[Math.floor(Math.random() * customers.length)];
    const id = chosen.id;

    // --- STEP 3: Fetch customer by ID ---
    const detailRes = http.get(`${BASE_URL}/api/customers/${id}`);

    // Validate detail endpoint
    check(detailRes, {
        'by-id status 200': (r) => r.status === 200,
    });

    // --- STEP 4: Think time ---
    // Simulates a real user pause between actions
    // Prevents unrealistically tight request loops
    sleep(1);
}