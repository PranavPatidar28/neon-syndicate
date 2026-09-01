# Deployment

Target: Vercel (web), Railway (API/worker), Neon (PostgreSQL), and a BullMQ-compatible managed Redis provider such as Upstash or Redis Cloud. Recheck current service limits in Launch Night. Standard `DATABASE_URL`/`REDIS_URL` contracts preserve provider portability; local Docker is an optional fallback only.

Use Neon's pooled connection string for `DATABASE_URL` at runtime and its direct connection string for `DIRECT_URL` during Prisma migrations. The pooled hostname contains `-pooler`; the direct hostname does not. Both URLs must use TLS and remain server-side secrets. Prisma commands load these values from the repository-root `.env` in local development.

Use the managed provider's TLS Redis protocol URL (`rediss://`) for `REDIS_URL`. Do not use an HTTPS REST endpoint: BullMQ and ioredis require the Redis wire protocol. Verify credentials and network access with `pnpm redis:check`.

Build web, API, and worker independently. Run `prisma migrate deploy` as a controlled release step, never `migrate dev` in production. Use backward-compatible expand/migrate/contract changes. Keep API and worker on compatible schema/job versions during rolling deployment.

Production readiness requires TLS, managed secrets, health/readiness checks, structured logs/request IDs, error tracking, queue depth/failure alerts, database backups and restore rehearsal, migration rollback plan, smoke tests, and documented demo seeding. Never place production secrets in Vercel `NEXT_PUBLIC_*` variables.
