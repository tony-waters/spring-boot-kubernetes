import http from 'k6/http';
import { check, sleep } from 'k6';

// ---------------------------------------------------------------------------
// PROFILE CONFIG
// ---------------------------------------------------------------------------
const TEST_PROFILE = __ENV.TEST_PROFILE || 'smoke';

const PROFILE_OPTIONS = {
    smoke: {
        vus: 1,
        iterations: 1,
        thresholds: {
            http_req_failed: ['rate==0'],
            checks: ['rate==1.0'],
            http_req_duration: ['p(95)<1000'],
        },
    },

    load: {
        vus: 100,
        duration: '30s',
        thresholds: {
            http_req_failed: ['rate<0.01'],
            checks: ['rate>0.99'],
            http_req_duration: ['p(95)<1000', 'p(99)<2000'],
        },
    },

    stress: {
        vus: 500,
        duration: '30s',
        thresholds: {
            http_req_failed: ['rate<0.01'],
            checks: ['rate>0.99'],
            http_req_duration: ['p(95)<1000', 'p(99)<2000'],
        },
    },
};

export const options = PROFILE_OPTIONS[TEST_PROFILE] || PROFILE_OPTIONS.smoke;

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const HOST_HEADER = __ENV.HOST_HEADER || 'application';

// ---------------------------------------------------------------------------
// PARAM BUILDERS
// ---------------------------------------------------------------------------
function jsonParams(name) {
    return {
        headers: {
            'Content-Type': 'application/json',
            'Host': HOST_HEADER,
        },
        tags: { name },
    };
}

function hostParams(name) {
    return {
        headers: {
            'Host': HOST_HEADER,
        },
        tags: { name },
    };
}

// ---------------------------------------------------------------------------
// UTILS
// ---------------------------------------------------------------------------
function randomSuffix() {
    return `${__VU}-${__ITER}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// ---------------------------------------------------------------------------
// TEST FLOW
// ---------------------------------------------------------------------------
export default function () {
    const suffix = randomSuffix();
    const customerName = `k6-behaviour-${suffix}`;

    // STEP 1: Create customer
    const createCustomerRes = http.post(
        `${BASE_URL}/api/customers`,
        JSON.stringify({ displayName: customerName }),
        jsonParams('POST /api/customers')
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
    const ticketDescription = `k6 behaviour ticket ${suffix} - this description is valid`;

    // STEP 2: Raise ticket
    const raiseTicketRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets`,
        JSON.stringify({ description: ticketDescription }),
        jsonParams('POST /api/customers/:customerId/tickets')
    );

    check(raiseTicketRes, {
        'raise ticket status 204': (r) => r.status === 204,
    });

    if (raiseTicketRes.status !== 204) {
        sleep(1);
        return;
    }

    // STEP 3: Read tickets to find created ticket
    const ticketListRes1 = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets`,
        hostParams('GET /api/customers/:customerId/tickets')
    );

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
    const tagName = `k6tag-${__VU}-${__ITER}`.toLowerCase();

    // STEP 4: Add tag
    const addTagRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}/tags`,
        JSON.stringify({ tagName }),
        jsonParams('POST /api/customers/:customerId/tickets/:ticketId/tags')
    );

    check(addTagRes, {
        'add tag status 204': (r) => r.status === 204,
    });

    if (addTagRes.status !== 204) {
        sleep(1);
        return;
    }

    // STEP 5: Verify tag filter
    const taggedTicketListRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets?tag=${encodeURIComponent(tagName)}`,
        hostParams('GET /api/customers/:customerId/tickets?tag=:tag')
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

    // STEP 6: Resolve ticket
    const resolveTicketRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}/resolve`,
        null,
        hostParams('POST /api/customers/:customerId/tickets/:ticketId/resolve')
    );

    check(resolveTicketRes, {
        'resolve ticket status 204': (r) => r.status === 204,
    });

    if (resolveTicketRes.status !== 204) {
        sleep(1);
        return;
    }

    // STEP 7: Verify resolved filter
    const resolvedTicketListRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets?status=RESOLVED`,
        hostParams('GET /api/customers/:customerId/tickets?status=RESOLVED')
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

    // STEP 8: Fetch detail
    const ticketDetailRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}`,
        hostParams('GET /api/customers/:customerId/tickets/:ticketId')
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

    sleep(1);
}