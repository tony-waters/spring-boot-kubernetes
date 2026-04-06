import http from 'k6/http';
import { check, sleep } from 'k6';

// Load profile:
// - 20 virtual users
// - each loops for 1 minute
export const options = {
    vus: 100,
    duration: '1m',
};

// Base URL can be overridden at runtime:
// k6 run -e BASE_URL=http://localhost:8080 customer-ticket-status-test.js
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Ticket statuses your API supports
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function () {
    // ---------------------------------------------------------------------------
    // STEP 1: Fetch a page of customers
    //
    // We randomise the page so we sample across the seeded dataset rather than
    // repeatedly hitting only the first page.
    // ---------------------------------------------------------------------------
    const page = Math.floor(Math.random() * 10);
    const size = 20;

    const customerListRes = http.get(
        `${BASE_URL}/api/customers?page=${page}&size=${size}`
    );

    check(customerListRes, {
        'customer list status 200': (r) => r.status === 200,
    });

    if (customerListRes.status !== 200) {
        sleep(1);
        return;
    }

    const customerListBody = customerListRes.json();
    const customers = customerListBody.content || [];

    check(customerListRes, {
        'customer list has content': () => customers.length > 0,
    });

    if (customers.length === 0) {
        sleep(1);
        return;
    }

    // ---------------------------------------------------------------------------
    // STEP 2: Pick a real customer ID from the returned page
    //
    // This avoids guessing IDs and keeps the test aligned with actual data.
    // ---------------------------------------------------------------------------
    const chosenCustomer =
        customers[Math.floor(Math.random() * customers.length)];
    const customerId = chosenCustomer.id;

    // ---------------------------------------------------------------------------
    // STEP 3: Pick a random ticket status filter
    //
    // This exercises the filtered ticket endpoint with realistic enum values.
    // ---------------------------------------------------------------------------
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

    const filteredTicketListRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets?status=${status}`
    );

    check(filteredTicketListRes, {
        'filtered ticket list status 200': (r) => r.status === 200,
    });

    if (filteredTicketListRes.status !== 200) {
        sleep(1);
        return;
    }

    const tickets = filteredTicketListRes.json() || [];

    // Make sure the response shape is sane
    check(filteredTicketListRes, {
        'filtered ticket list parsed': () => Array.isArray(tickets),
    });

    // ---------------------------------------------------------------------------
    // STEP 4: Validate returned tickets match the requested status
    //
    // If the endpoint says status=OPEN, every returned ticket should be OPEN.
    // This checks correctness, not just availability.
    // ---------------------------------------------------------------------------
    check(filteredTicketListRes, {
        'all returned tickets match requested status': () =>
            tickets.every((t) => t.status === status),
    });

    // ---------------------------------------------------------------------------
    // STEP 5: If any filtered tickets exist, fetch one detail record
    //
    // This exercises the next hop in the filtered read journey.
    // ---------------------------------------------------------------------------
    if (tickets.length > 0) {
        const chosenTicket = tickets[Math.floor(Math.random() * tickets.length)];
        const ticketId = chosenTicket.id;

        const ticketDetailRes = http.get(
            `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}`
        );

        check(ticketDetailRes, {
            'filtered ticket detail status 200': (r) => r.status === 200,
        });
    }

    // ---------------------------------------------------------------------------
    // STEP 6: Think time
    //
    // Simulates a user pause and avoids unrealistic tight request loops.
    // ---------------------------------------------------------------------------
    sleep(1);
}