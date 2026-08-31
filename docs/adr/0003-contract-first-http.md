# ADR 0003: Versioned contract-first HTTP

- Status: accepted
- Decision: use `/api/v1`, OpenAPI, consistent errors/request IDs, stable cursor pagination, and a generated web client.
- Why: prevents frontend/backend drift and makes compatibility visible.
- Consequence: contract changes require tests and deliberate compatibility decisions.
