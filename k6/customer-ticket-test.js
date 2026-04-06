import http from 'k6/http';
import { check, sleep } from 'k6';

// Load profile:
// - 20 virtual users
// - each loops for 1 minute
export const options = {
    vus: 20,
    duration: '1m',
};

// Base URL can be overridden at runtime:
// k6 run -e BASE_URL=http://localhost:8080 customer-ticket-test.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
    // ---------------------------------------------------------------------------
    // STEP 1: Fetch a page of customers
    //
    // We randomise the page so we do not repeatedly hammer only page 0.
    // This gives broader coverage across seeded data.
    // ---------------------------------------------------------------------------
    const page = Math.floor(Math.random() * 10);
    const size = 20;

    const customerListRes = http.get(
        `${BASE_URL}/api/customers?page=${page}&size=${size}`
    );

    check(customerListRes, {
        'customer list status 200': (r) => r.status === 200,
    });

    // If the list endpoint failed, stop this iteration early.
    if (customerListRes.status !== 200) {
        sleep(1);
        return;
    }

    const customerListBody = customerListRes.json();
    const customers = customerListBody.content || [];

    check(customerListRes, {
        'customer list has content': () => customers.length > 0,
    });

    // Empty page: nothing useful to do this iteration.
    if (customers.length === 0) {
        sleep(1);
        return;
    }

    // ---------------------------------------------------------------------------
    // STEP 2: Pick a real customer from the returned page
    //
    // This avoids guessing random IDs, which gave misleading 404-heavy results.
    // ---------------------------------------------------------------------------
    const chosenCustomer =
        customers[Math.floor(Math.random() * customers.length)];
    const customerId = chosenCustomer.id;

    // ---------------------------------------------------------------------------
    // STEP 3: Fetch customer detail
    //
    // This validates the list -> detail flow for a known-valid customer ID.
    // ---------------------------------------------------------------------------
    const customerDetailRes = http.get(
        `${BASE_URL}/api/customers/${customerId}`
    );

    check(customerDetailRes, {
        'customer detail status 200': (r) => r.status === 200,
    });

    if (customerDetailRes.status !== 200) {
        sleep(1);
        return;
    }

    // ---------------------------------------------------------------------------
    // STEP 4: Fetch tickets for that customer
    //
    // This exercises a heavier query path than the basic customer endpoints.
    // ---------------------------------------------------------------------------
    const ticketListRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets`
    );

    check(ticketListRes, {
        'ticket list status 200': (r) => r.status === 200,
    });

    if (ticketListRes.status !== 200) {
        sleep(1);
        return;
    }

    const tickets = ticketListRes.json() || [];

    // This is informational: some customers may genuinely have no tickets.
    check(ticketListRes, {
        'ticket list parsed': () => Array.isArray(tickets),
    });

    // ---------------------------------------------------------------------------
    // STEP 5: If tickets exist, fetch one ticket detail
    //
    // This tests the full path:
    // customers page -> customer detail -> ticket list -> ticket detail
    // ---------------------------------------------------------------------------
    if (tickets.length > 0) {
        const chosenTicket = tickets[Math.floor(Math.random() * tickets.length)];
        const ticketId = chosenTicket.id;

        const ticketDetailRes = http.get(
            `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}`
        );

        check(ticketDetailRes, {
            'ticket detail status 200': (r) => r.status === 200,
        });
    }

    // ---------------------------------------------------------------------------
    // STEP 6: Think time
    //
    // Simulates a user pause and prevents unrealistically tight loops.
    // ---------------------------------------------------------------------------
    sleep(1);
}