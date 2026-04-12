# Spring Boot JPA + Kubernetes Demo

See [this post](https://tony-waters.github.io/2026/03/03/demo-spring-rest-app.html) to get things up and running using `kind`.

**Customers / Tickets / Tags (Command–Query Separation)**

A Spring REST application demonstrating:

- Aggregate design with enforced invariants
- Command / Query separation (CQRS-lite)
- JPA projections for efficient reads
- Kubernetes deployment via Helm + Terraform
- Deterministic seed data (separate job)
- Load testing using k6

---

## Domain Model

- **Customer**
    - owns Tickets
    - has optional Profile

- **Ticket**
    - belongs to Customer
    - has lifecycle: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`
    - can have Tags

- **Tag**
    - simple label attached to tickets

### Key Design Choices

- Entities enforce rules (e.g. cannot modify resolved tickets)
- No setters — behaviour methods only
- Bidirectional relationships managed internally

---

## Running Locally

```bash
./mvnw spring-boot:run
```

API:

http://localhost:8080/api/customers

---

## Kubernetes Deployment

```bash
cd terraform
terraform init
terraform apply
```

Then:

```bash
kubectl port-forward svc/spring-boot-app 8080:80
```

---

## Seed Data

Seed data is **not tied to app startup**.

Run manually:

```bash
cd seed && ./run-seed.sh
```

---

## Load Testing (k6)

All scripts live in `/k6`.

### Read Path

```bash
k6 run customer-test.js
k6 run customer-ticket-test.js
k6 run customer-ticket-status-test.js
```

### Write Path

```bash
k6 run customer-write-smoke-test.js
```

### Behaviour Flow (most realistic)

```bash
k6 run customer-behaviour-write-test.js
```

---

## What the Tests Prove

### Read Side
- pagination + sorting
- filtering by status and tag
- stable under concurrency

### Write Side
- aggregate mutations (customer + tickets)
- tag operations
- state transitions
- read-after-write consistency

---

## Testing Strategy

- **Unit / Data tests**
    - `@DataJpaTest` for repositories & projections

- **Service tests**
    - command behaviour and invariants

- **k6 tests**
    - end-to-end + concurrency validation

---

## Future Improvements

- Authentication / authorization
- Observability (metrics, tracing)
- DB indexing + query tuning
- CI/CD pipeline
- Data cleanup strategy for load tests

---

## Summary

A realistic backend demonstrating:

- clean domain modelling
- separation of concerns
- Kubernetes deployment
- and verified behaviour under load
