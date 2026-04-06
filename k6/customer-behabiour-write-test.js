import http from 'k6/http';
import { check, sleep } from 'k6';

// Slightly heavier than the basic write smoke test, but still modest.
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
    // Unique names keep the test isolated and make debugging easier.
    // ---------------------------------------------------------------------------
    const suffix = randomSuffix();
    const customerName = `k6-behaviour-${suffix}`;

    const createCustomerRes = http.post(
        `${BASE_URL}/api/customers`,
        JSON.stringify({
            displayName: customerName,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );

    check(createCustomerRes, {
        'create customer status 201': (r) => r.status === 201,
        'create customer has location header': (r) => !!r.headers.Location,
    });

    if (createCustomerRes.status !== 201 || !createCustomerRes.headers.Location) {
        sleep(1);
        return;
    }

    const customerId = createCustomerRes.headers.Location.split('/').pop();

    // ---------------------------------------------------------------------------
    // STEP 2: Raise a ticket
    //
    // This gives us a real aggregate to mutate in later steps.
    // ---------------------------------------------------------------------------
    const ticketDescription = `k6 behaviour ticket ${suffix} - this description is valid`;

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
    // STEP 3: Read tickets and pick the created one
    //
    // We need the real ticket ID before we can mutate it further.
    // ---------------------------------------------------------------------------
    const ticketListRes1 = http.get(`${BASE_URL}/api/customers/${customerId}/tickets`);

    check(ticketListRes1, {
        'ticket list after create status 200': (r) => r.status === 200,
    });

    if (ticketListRes1.status !== 200) {
        sleep(1);
        return;
    }

    const tickets1 = ticketListRes1.json() || [];

    check(ticketListRes1, {
        'ticket list parsed after create': () => Array.isArray(tickets1),
        'ticket list has created ticket': () =>
            tickets1.some((t) => t.description === ticketDescription),
    });

    const createdTicket = tickets1.find((t) => t.description === ticketDescription);
    if (!createdTicket) {
        sleep(1);
        return;
    }

    const ticketId = createdTicket.id;

    // ---------------------------------------------------------------------------
    // STEP 4: Add a tag to the ticket
    //
    // Use a deterministic-but-unique tag so we can verify filtered reads.
    // ---------------------------------------------------------------------------
    const tagName = `k6tag-${__VU}-${__ITER}`.toLowerCase();

    const addTagRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}/tags`,
        JSON.stringify({
            tagName: tagName,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );

    check(addTagRes, {
        'add tag status 204': (r) => r.status === 204,
    });

    if (addTagRes.status !== 204) {
        sleep(1);
        return;
    }

    // ---------------------------------------------------------------------------
    // STEP 5: Verify tag-filtered read sees the ticket
    //
    // This checks that the write is visible through the query API.
    // ---------------------------------------------------------------------------
    const taggedTicketListRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets?tag=${encodeURIComponent(tagName)}`
    );

    check(taggedTicketListRes, {
        'tag-filtered ticket list status 200': (r) => r.status === 200,
    });

    if (taggedTicketListRes.status !== 200) {
        sleep(1);
        return;
    }

    const taggedTickets = taggedTicketListRes.json() || [];

    check(taggedTicketListRes, {
        'tag-filtered list parsed': () => Array.isArray(taggedTickets),
        'tag-filtered list contains created ticket': () =>
            taggedTickets.some((t) => t.id === ticketId),
    });

    // ---------------------------------------------------------------------------
    // STEP 6: Resolve the ticket
    //
    // This exercises a state transition command on the aggregate.
    // ---------------------------------------------------------------------------
    const resolveTicketRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}/resolve`,
        null
    );

    check(resolveTicketRes, {
        'resolve ticket status 204': (r) => r.status === 204,
    });

    if (resolveTicketRes.status !== 204) {
        sleep(1);
        return;
    }

    // ---------------------------------------------------------------------------
    // STEP 7: Verify status-filtered read sees the resolved ticket
    //
    // This checks that the command-side state change is reflected on the read side.
    // ---------------------------------------------------------------------------
    const resolvedTicketListRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets?status=RESOLVED`
    );

    check(resolvedTicketListRes, {
        'status-filtered ticket list status 200': (r) => r.status === 200,
    });

    if (resolvedTicketListRes.status !== 200) {
        sleep(1);
        return;
    }

    const resolvedTickets = resolvedTicketListRes.json() || [];

    check(resolvedTicketListRes, {
        'status-filtered list parsed': () => Array.isArray(resolvedTickets),
        'status-filtered list contains created ticket': () =>
            resolvedTickets.some((t) => t.id === ticketId && t.status === 'RESOLVED'),
    });

    // ---------------------------------------------------------------------------
    // STEP 8: Fetch ticket detail and verify both state and tags
    //
    // This is the final consistency check for the full write -> read flow.
    // ---------------------------------------------------------------------------
    const ticketDetailRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}`
    );

    check(ticketDetailRes, {
        'ticket detail status 200': (r) => r.status === 200,
    });

    if (ticketDetailRes.status === 200) {
        const detail = ticketDetailRes.json();

        check(ticketDetailRes, {
            'ticket detail shows resolved status': () => detail.status === 'RESOLVED',
            'ticket detail includes created tag': () =>
                Array.isArray(detail.tagNames) && detail.tagNames.includes(tagName),
        });
    }

    // ---------------------------------------------------------------------------
    // STEP 9: Think time
    //
    // Prevents unrealistically tight write loops.
    // ---------------------------------------------------------------------------
    sleep(1);
}