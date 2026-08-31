# Deployment

Target: Vercel (web), Railway (API/worker), Neon (PostgreSQL), Upstash (Redis). Recheck current service limits in Launch Night. Local Docker and standard `DATABASE_URL`/`REDIS_URL` contracts are mandatory fallbacks.

Build web, API, and worker independently. Run `prisma migrate deploy` as a controlled release step, never `migrate dev` in production. Use backward-compatible expand/migrate/contract changes. Keep API and worker on compatible schema/job versions during rolling deployment.

Production readiness requires TLS, managed secrets, health/readiness checks, structured logs/request IDs, error tracking, queue depth/failure alerts, database backups and restore rehearsal, migration rollback plan, smoke tests, and documented demo seeding. Never place production secrets in Vercel `NEXT_PUBLIC_*` variables.
