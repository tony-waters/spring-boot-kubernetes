import http from 'k6/http';
import { check, sleep } from 'k6';

// Keep this modest to start.
// Writes are heavier, mutate state, and can expose real bugs quickly.
export const options = {
    vus: 10,
    duration: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

function randomSuffix() {
    return `${__VU}-${__ITER}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function () {
    // ---------------------------------------------------------------------------
    // STEP 1: Create a customer
    //
    // Use a unique display name to avoid accidental collisions and make debugging
    // easier if you inspect persisted data later.
    // ---------------------------------------------------------------------------
    const suffix = randomSuffix();
    const originalName = `k6-customer-${suffix}`;

    const createRes = http.post(
        `${BASE_URL}/api/customers`,
        JSON.stringify({
            displayName: originalName,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );

    check(createRes, {
        'create customer status 201': (r) => r.status === 201,
        'create customer has location header': (r) => !!r.headers.Location,
    });

    if (createRes.status !== 201 || !createRes.headers.Location) {
        sleep(1);
        return;
    }

    // Extract created customer id from Location header, e.g. /api/customers/123
    const location = createRes.headers.Location;
    const customerId = location.split('/').pop();

    // ---------------------------------------------------------------------------
    // STEP 2: Fetch the newly created customer
    //
    // Confirms the create actually produced a readable resource.
    // ---------------------------------------------------------------------------
    const detailRes1 = http.get(`${BASE_URL}/api/customers/${customerId}`);

    check(detailRes1, {
        'initial customer detail status 200': (r) => r.status === 200,
    });

    if (detailRes1.status !== 200) {
        sleep(1);
        return;
    }

    // ---------------------------------------------------------------------------
    // STEP 3: Change display name
    //
    // Tests a simple update path.
    // ---------------------------------------------------------------------------
    const updatedName = `k6-updated-${suffix}`;

    const renameRes = http.put(
        `${BASE_URL}/api/customers/${customerId}/display-name`,
        JSON.stringify({
            displayName: updatedName,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );

    check(renameRes, {
        'change display name status 204': (r) => r.status === 204,
    });

    if (renameRes.status !== 204) {
        sleep(1);
        return;
    }

    // ---------------------------------------------------------------------------
    // STEP 4: Re-fetch customer and verify updated name
    //
    // This checks write -> read consistency for the basic update flow.
    // ---------------------------------------------------------------------------
    const detailRes2 = http.get(`${BASE_URL}/api/customers/${customerId}`);

    check(detailRes2, {
        'updated customer detail status 200': (r) => r.status === 200,
    });

    if (detailRes2.status === 200) {
        const body = detailRes2.json();
        check(detailRes2, {
            'display name updated': () => body.displayName === updatedName,
        });
    }

    // ---------------------------------------------------------------------------
    // STEP 5: Raise a ticket for the customer
    //
    // Tests a second write path that touches the aggregate.
    // ---------------------------------------------------------------------------
    const ticketDescription = `k6 ticket for ${suffix} - this is valid`;

    const raiseTicketRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets`,
        JSON.stringify({
            description: ticketDescription,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );

    check(raiseTicketRes, {
        'raise ticket status 204': (r) => r.status === 204,
    });

    if (raiseTicketRes.status !== 204) {
        sleep(1);
        return;
    }

    // ---------------------------------------------------------------------------
    // STEP 6: Fetch tickets and verify at least one exists
    //
    // This gives a basic end-to-end check for create ticket -> read tickets.
    // ---------------------------------------------------------------------------
    const ticketListRes = http.get(`${BASE_URL}/api/customers/${customerId}/tickets`);

    check(ticketListRes, {
        'ticket list after create status 200': (r) => r.status === 200,
    });

    if (ticketListRes.status === 200) {
        const tickets = ticketListRes.json() || [];

        check(ticketListRes, {
            'ticket list parsed': () => Array.isArray(tickets),
            'ticket list has at least one ticket': () => tickets.length >= 1,
            'created ticket description present': () =>
                tickets.some((t) => t.description === ticketDescription),
        });
    }

    // ---------------------------------------------------------------------------
    // STEP 7: Think time
    //
    // Prevents unrealistic tight-loop write spam.
    // ---------------------------------------------------------------------------
    sleep(1);
}