# ADR 0001: Modular monolith with separate runtime processes

- Status: accepted
- Decision: one monorepo and shared domain boundaries, deployed as web, API, and worker processes.
- Why: teaches explicit boundaries and async operations without premature microservice networking and consistency cost.
- Consequence: modules must not bypass ownership; future extraction requires evidence from scaling or team boundaries.
