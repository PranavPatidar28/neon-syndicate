# ADR 0002: PostgreSQL is authoritative

- Status: accepted
- Decision: durable game and economy state lives in PostgreSQL. Redis supports queues, cache, presence, and ephemeral delivery only.
- Why: transactional invariants and recoverability matter more than low-latency ephemeral state.
- Consequence: Redis loss may degrade or delay service, but reconciliation rebuilds from PostgreSQL.
