# Testing Strategy

Use the cheapest test that proves the risk: unit tests for pure rules/state machines; PostgreSQL integration tests for constraints, transactions, and concurrency; HTTP tests for transport/auth/error contracts; worker tests for retry/idempotency; socket tests for authentication/rooms/recovery; Playwright for critical user journeys.

Tests must be deterministic: explicit clocks/random sources, isolated data, unique identifiers, and no ordering assumptions without `ORDER BY`. Avoid mocking Prisma for transaction behavior. Verify externally observable outcomes and important invariants, not private implementation details.

`pnpm verify` is the code gate. Service-backed suites must fail clearly when required infrastructure is missing and explain how to start it. A test can be quarantined only with a tracked reason, owner, and removal condition.
