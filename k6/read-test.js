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
const CUSTOMER_PAGE_SIZE = Number(__ENV.CUSTOMER_PAGE_SIZE || '20');

// ---------------------------------------------------------------------------
// PARAM BUILDERS
// ---------------------------------------------------------------------------
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
function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function extractCustomers(payload) {
    if (!payload) {
        return [];
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload.content)) {
        return payload.content;
    }

    return [];
}

function extractTickets(payload) {
    if (!payload) {
        return [];
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload.content)) {
        return payload.content;
    }

    return [];
}

function firstNonEmptyTag(ticket) {
    if (!ticket) {
        return null;
    }

    if (Array.isArray(ticket.tagNames) && ticket.tagNames.length > 0) {
        return ticket.tagNames[0];
    }

    if (Array.isArray(ticket.tags) && ticket.tags.length > 0) {
        const firstTag = ticket.tags[0];
        if (typeof firstTag === 'string' && firstTag.trim() !== '') {
            return firstTag;
        }
        if (firstTag && typeof firstTag.name === 'string' && firstTag.name.trim() !== '') {
            return firstTag.name;
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// TEST FLOW
// ---------------------------------------------------------------------------
export default function () {
    // STEP 1: Read customers
    const listCustomersRes = http.get(
        `${BASE_URL}/api/customers?page=0&size=${CUSTOMER_PAGE_SIZE}`,
        hostParams('GET /api/customers?page=:page&size=:size')
    );

    check(listCustomersRes, {
        'list customers status 200': (r) => r.status === 200,
    });

    if (listCustomersRes.status !== 200) {
        sleep(0.5);
        return;
    }

    const customers = extractCustomers(listCustomersRes.json());

    check(listCustomersRes, {
        'customer list has at least one customer': () => customers.length > 0,
    });

    if (customers.length === 0) {
        sleep(0.5);
        return;
    }

    const customer = randomItem(customers);
    const customerId = customer?.id;

    check(listCustomersRes, {
        'selected customer has id': () => !!customerId,
    });

    if (!customerId) {
        sleep(0.5);
        return;
    }

    // STEP 2: Get customer detail
    const getCustomerRes = http.get(
        `${BASE_URL}/api/customers/${customerId}`,
        hostParams('GET /api/customers/:customerId')
    );

    check(getCustomerRes, {
        'get customer status 200': (r) => r.status === 200,
    });

    // STEP 3: List tickets for selected customer
    const listTicketsRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets`,
        hostParams('GET /api/customers/:customerId/tickets')
    );

    check(listTicketsRes, {
        'list tickets status 200': (r) => r.status === 200,
    });

    if (listTicketsRes.status !== 200) {
        sleep(0.5);
        return;
    }

    const tickets = extractTickets(listTicketsRes.json());

    check(listTicketsRes, {
        'ticket list parsed': () => Array.isArray(tickets),
    });

    // No tickets is not necessarily a failure for a read test.
    if (tickets.length === 0) {
        sleep(0.5);
        return;
    }

    const ticket = randomItem(tickets);
    const ticketId = ticket?.id;

    check(listTicketsRes, {
        'selected ticket has id': () => !!ticketId,
    });

    if (!ticketId) {
        sleep(0.5);
        return;
    }

    // STEP 4: Get ticket detail
    const ticketDetailRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}`,
        hostParams('GET /api/customers/:customerId/tickets/:ticketId')
    );

    check(ticketDetailRes, {
        'ticket detail status 200': (r) => r.status === 200,
    });

    // STEP 5: Filter by the selected ticket status if present
    if (ticket.status) {
        const filterStatusRes = http.get(
            `${BASE_URL}/api/customers/${customerId}/tickets?status=${encodeURIComponent(ticket.status)}`,
            hostParams('GET /api/customers/:customerId/tickets?status=:status')
        );

        check(filterStatusRes, {
            'filter by status status 200': (r) => r.status === 200,
        });

        if (filterStatusRes.status === 200) {
            const statusFilteredTickets = extractTickets(filterStatusRes.json());

            check(filterStatusRes, {
                'filter by status parsed': () => Array.isArray(statusFilteredTickets),
                'filter by status contains selected ticket': () =>
                    statusFilteredTickets.some((t) => t.id === ticketId),
            });
        }
    }

    // STEP 6: Filter by a real tag if one exists
    const tagName = firstNonEmptyTag(ticket);

    if (tagName) {
        const filterTagRes = http.get(
            `${BASE_URL}/api/customers/${customerId}/tickets?tag=${encodeURIComponent(tagName)}`,
            hostParams('GET /api/customers/:customerId/tickets?tag=:tag')
        );

        check(filterTagRes, {
            'filter by tag status 200': (r) => r.status === 200,
        });

        if (filterTagRes.status === 200) {
            const tagFilteredTickets = extractTickets(filterTagRes.json());

            check(filterTagRes, {
                'filter by tag parsed': () => Array.isArray(tagFilteredTickets),
                'filter by tag contains selected ticket': () =>
                    tagFilteredTickets.some((t) => t.id === ticketId),
            });
        }
    }

    sleep(0.5);
}