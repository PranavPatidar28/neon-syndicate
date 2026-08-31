# Architecture

The monorepo is a modular monolith with separately deployable web, API, and worker processes. This keeps domain boundaries visible without premature distributed-system overhead.

## Runtime flow

Browser → Next.js → versioned NestJS API → PostgreSQL. The API commits authoritative state and enqueues durable work. Worker → BullMQ/Redis → PostgreSQL transaction → event/notification publication. Socket.IO delivers projections; reconnecting clients recover from PostgreSQL-backed cursors rather than trusting missed Redis messages.

## Contracts

- HTTP prefix: `/api/v1`; Swagger: `/docs`.
- Errors eventually use `{ error: { code, message, details? }, requestId }`.
- Cursor pagination uses stable ordering and opaque cursors.
- `packages/contracts` contains transport-neutral primitives and generated-client exports, not duplicated domain entities.
- Configuration is validated at process startup. `DATABASE_URL` and `REDIS_URL` are provider-neutral.

## Boundaries

Domain modules own rules and persistence access. Controllers and gateways translate transports. Background jobs carry identifiers and idempotency keys, not mutable aggregate snapshots. Redis loss may delay work but must not create authoritative loss. Read ADRs before changing these constraints.
