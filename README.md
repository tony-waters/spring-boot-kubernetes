# Spring Boot JPA + Kubernetes Demo
**Customers / Tickets / Tags (Command–Query Separation)**

A production-style backend demonstrating:

- Aggregate design with enforced invariants
- Command / Query separation (CQRS-lite)
- JPA projections for efficient reads
- Kubernetes deployment via Helm + Terraform
- Deterministic seed data (separate job)
- Real load testing using k6

---

## Why This Project Exists

Most Spring Boot demos stop at CRUD.

This one goes further:

- Models a real aggregate (`Customer → Tickets → Tags`)
- Enforces business rules inside entities
- Separates write logic from read models
- Deploys to Kubernetes
- Verifies behaviour under load (not just unit tests)

---

## Architecture (High Level)

```
        ┌──────────────────────────────┐
        │        Controllers           │
        │  (REST API: /api/customers) │
        └──────────────┬───────────────┘
                       │
        ┌──────────────▼───────────────┐
        │         Services             │
        │  Command + Query separation  │
        └──────────────┬───────────────┘
                       │
     ┌─────────────────┴─────────────────┐
     │                                   │
┌────▼─────┐                     ┌───────▼────────┐
│ Command  │                     │ Query           │
│ Side     │                     │ Side            │
│ (Domain) │                     │ (DTOs)          │
└────┬─────┘                     └───────┬────────┘
     │                                   │
┌────▼──────────────┐          ┌─────────▼────────────┐
│ Entities          │          │ Projection Queries   │
│ - Customer        │          │ (no entity leakage)  │
│ - Ticket          │          └──────────────────────┘
│ - Tag             │
└───────────────────┘

              PostgreSQL
```

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
kubectl create job --from=cronjob/seed-job seed-job-manual
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

## Example Flow Tested

1. Create customer
2. Raise ticket
3. Add tag
4. Verify tag-filtered query
5. Resolve ticket
6. Verify status-filtered query
7. Fetch ticket detail

All under concurrent load.

---

## Performance Snapshot

Typical results (local / port-forward):

| Metric | Value |
|------|------|
| Read latency (avg) | ~1–6 ms |
| Write latency (avg) | ~10–35 ms |
| Failure rate | 0% |
| Throughput | 50–200 req/s |

---

## Testing Strategy

- **Unit / Data tests**
    - `@DataJpaTest` for repositories & projections

- **Service tests**
    - command behaviour and invariants

- **k6 tests**
    - end-to-end + concurrency validation

---

## Key Takeaways

- JPA is fine — if you control your aggregates
- DTO projections beat exposing entities
- CQRS-lite keeps complexity manageable
- Seed jobs > startup data hacks
- Load testing catches real problems early

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

Not just CRUD — something closer to production thinking.