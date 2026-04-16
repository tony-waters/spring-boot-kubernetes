import http from 'k6/http';
import { check, sleep } from 'k6';

// ---------------------------------------------------------------------------
// PROFILE SELECTION
// ---------------------------------------------------------------------------
const TEST_PROFILE = __ENV.TEST_PROFILE || 'smoke';

const PROFILE_OPTIONS = {
    smoke: {
        vus: 1,
        iterations: 1,
        thresholds: {
            http_req_failed: ['rate==0'],
            http_req_duration: ['p(95)<1000'],
            checks: ['rate==1.0'],
        },
    },
    load: {
        vus: 100,
        duration: '30s',
        thresholds: {
            http_req_failed: ['rate<0.01'],
            http_req_duration: ['p(95)<1000', 'p(99)<2000'],

            'checks{step:create_customer}': ['rate>0.99'],
            'checks{step:raise_ticket}': ['rate>0.99'],
            'checks{step:list_tickets}': ['rate>0.99'],
            'checks{step:add_tag}': ['rate>0.99'],
            'checks{step:filter_by_tag}': ['rate>0.99'],
            'checks{step:resolve_ticket}': ['rate>0.99'],
            'checks{step:filter_by_status}': ['rate>0.99'],
            'checks{step:ticket_detail}': ['rate>0.99'],

            'http_req_duration{step:create_customer}': ['p(95)<1000'],
            'http_req_duration{step:raise_ticket}': ['p(95)<1000'],
            'http_req_duration{step:list_tickets}': ['p(95)<1000'],
            'http_req_duration{step:add_tag}': ['p(95)<1000'],
            'http_req_duration{step:filter_by_tag}': ['p(95)<1000'],
            'http_req_duration{step:resolve_ticket}': ['p(95)<1000'],
            'http_req_duration{step:filter_by_status}': ['p(95)<1000'],
            'http_req_duration{step:ticket_detail}': ['p(95)<1000'],
        },
    },
    break: {
        vus: 1000,
        duration: '30s',
        thresholds: {
            http_req_failed: ['rate<0.01'],
            http_req_duration: ['p(95)<1000', 'p(99)<2000'],

            'checks{step:create_customer}': ['rate>0.99'],
            'checks{step:raise_ticket}': ['rate>0.99'],
            'checks{step:list_tickets}': ['rate>0.99'],
            'checks{step:add_tag}': ['rate>0.99'],
            'checks{step:filter_by_tag}': ['rate>0.99'],
            'checks{step:resolve_ticket}': ['rate>0.99'],
            'checks{step:filter_by_status}': ['rate>0.99'],
            'checks{step:ticket_detail}': ['rate>0.99'],

            'http_req_duration{step:create_customer}': ['p(95)<1000'],
            'http_req_duration{step:raise_ticket}': ['p(95)<1000'],
            'http_req_duration{step:list_tickets}': ['p(95)<1000'],
            'http_req_duration{step:add_tag}': ['p(95)<1000'],
            'http_req_duration{step:filter_by_tag}': ['p(95)<1000'],
            'http_req_duration{step:resolve_ticket}': ['p(95)<1000'],
            'http_req_duration{step:filter_by_status}': ['p(95)<1000'],
            'http_req_duration{step:ticket_detail}': ['p(95)<1000'],
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
function jsonParams(step) {
    return {
        headers: {
            'Content-Type': 'application/json',
            'Host': HOST_HEADER,
        },
        tags: { step, profile: TEST_PROFILE },
    };
}

function hostParams(step) {
    return {
        headers: {
            'Host': HOST_HEADER,
        },
        tags: { step, profile: TEST_PROFILE },
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

    const createCustomerRes = http.post(
        `${BASE_URL}/api/customers`,
        JSON.stringify({ displayName: customerName }),
        jsonParams('create_customer')
    );

    check(createCustomerRes, {
        'create customer status 201': (r) => r.status === 201,
        'create customer has location header': (r) => !!r.headers.Location,
    }, { step: 'create_customer', profile: TEST_PROFILE });

    if (createCustomerRes.status !== 201 || !createCustomerRes.headers.Location) {
        sleep(1);
        return;
    }

    const customerId = createCustomerRes.headers.Location.split('/').pop();
    const ticketDescription = `k6 behaviour ticket ${suffix} - this description is valid`;

    const raiseTicketRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets`,
        JSON.stringify({ description: ticketDescription }),
        jsonParams('raise_ticket')
    );

    check(raiseTicketRes, {
        'raise ticket status 204': (r) => r.status === 204,
    }, { step: 'raise_ticket', profile: TEST_PROFILE });

    if (raiseTicketRes.status !== 204) {
        sleep(1);
        return;
    }

    const ticketListRes1 = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets`,
        hostParams('list_tickets')
    );

    check(ticketListRes1, {
        'ticket list after create status 200': (r) => r.status === 200,
    }, { step: 'list_tickets', profile: TEST_PROFILE });

    if (ticketListRes1.status !== 200) {
        sleep(1);
        return;
    }

    const tickets1 = ticketListRes1.json() || [];

    check(ticketListRes1, {
        'ticket list parsed after create': () => Array.isArray(tickets1),
        'ticket list has created ticket': () =>
            tickets1.some((t) => t.description === ticketDescription),
    }, { step: 'list_tickets', profile: TEST_PROFILE });

    const createdTicket = tickets1.find((t) => t.description === ticketDescription);
    if (!createdTicket) {
        sleep(1);
        return;
    }

    const ticketId = createdTicket.id;
    const tagName = `k6tag-${__VU}-${__ITER}`.toLowerCase();

    const addTagRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}/tags`,
        JSON.stringify({ tagName }),
        jsonParams('add_tag')
    );

    check(addTagRes, {
        'add tag status 204': (r) => r.status === 204,
    }, { step: 'add_tag', profile: TEST_PROFILE });

    if (addTagRes.status !== 204) {
        sleep(1);
        return;
    }

    const taggedTicketListRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets?tag=${encodeURIComponent(tagName)}`,
        hostParams('filter_by_tag')
    );

    check(taggedTicketListRes, {
        'tag-filtered ticket list status 200': (r) => r.status === 200,
    }, { step: 'filter_by_tag', profile: TEST_PROFILE });

    if (taggedTicketListRes.status !== 200) {
        sleep(1);
        return;
    }

    const taggedTickets = taggedTicketListRes.json() || [];

    check(taggedTicketListRes, {
        'tag-filtered list parsed': () => Array.isArray(taggedTickets),
        'tag-filtered list contains created ticket': () =>
            taggedTickets.some((t) => t.id === ticketId),
    }, { step: 'filter_by_tag', profile: TEST_PROFILE });

    const resolveTicketRes = http.post(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}/resolve`,
        null,
        hostParams('resolve_ticket')
    );

    check(resolveTicketRes, {
        'resolve ticket status 204': (r) => r.status === 204,
    }, { step: 'resolve_ticket', profile: TEST_PROFILE });

    if (resolveTicketRes.status !== 204) {
        sleep(1);
        return;
    }

    const resolvedTicketListRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets?status=RESOLVED`,
        hostParams('filter_by_status')
    );

    check(resolvedTicketListRes, {
        'status-filtered ticket list status 200': (r) => r.status === 200,
    }, { step: 'filter_by_status', profile: TEST_PROFILE });

    if (resolvedTicketListRes.status !== 200) {
        sleep(1);
        return;
    }

    const resolvedTickets = resolvedTicketListRes.json() || [];

    check(resolvedTicketListRes, {
        'status-filtered list parsed': () => Array.isArray(resolvedTickets),
        'status-filtered list contains created ticket': () =>
            resolvedTickets.some((t) => t.id === ticketId && t.status === 'RESOLVED'),
    }, { step: 'filter_by_status', profile: TEST_PROFILE });

    const ticketDetailRes = http.get(
        `${BASE_URL}/api/customers/${customerId}/tickets/${ticketId}`,
        hostParams('ticket_detail')
    );

    check(ticketDetailRes, {
        'ticket detail status 200': (r) => r.status === 200,
    }, { step: 'ticket_detail', profile: TEST_PROFILE });

    if (ticketDetailRes.status === 200) {
        const detail = ticketDetailRes.json();

        check(ticketDetailRes, {
            'ticket detail shows resolved status': () => detail.status === 'RESOLVED',
            'ticket detail includes created tag': () =>
                Array.isArray(detail.tagNames) && detail.tagNames.includes(tagName),
        }, { step: 'ticket_detail', profile: TEST_PROFILE });
    }

    sleep(1);
}