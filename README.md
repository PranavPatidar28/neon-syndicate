# Neon Syndicate

A 12-week, hints-first full-stack mastery campaign disguised as a co-op cyberpunk strategy RPG. This repository is a production-shaped foundation; **you build every product feature**.

## Start here

1. Install Node 24.14+, pnpm 10.33+, Git, and Docker Desktop.
2. Copy `.env.example` to `.env`.
3. Run `pnpm install`, `pnpm infra:up`, and `pnpm db:generate`.
4. Verify with `pnpm verify` and `pnpm test:e2e`.
5. Read [`docs/START_HERE.md`](docs/START_HERE.md), then run `pnpm quest:list` and `pnpm quest:start -- 01-01`.

For the complete guided interface, run `pnpm mission-control` and open `http://127.0.0.1:3100`. Mission Control is a separate local app; `apps/web` remains the game you build.

Mission Control can optionally use a local Antigravity Claude Proxy for structured, hints-first mentoring. Start the proxy on `http://localhost:8080`; the default model can be changed with `ANTIGRAVITY_MENTOR_MODEL`. Context is redacted, previewed, and hash-bound to explicit approval before it is sent. The campaign remains fully usable without the proxy.

Without Docker, code-only verification still works. Database and Redis exercises require Docker or compatible hosted URLs.

## Commands

| Command                              | Purpose                                                    |
| ------------------------------------ | ---------------------------------------------------------- |
| `pnpm dev`                           | Run web, API, and worker in watch mode                     |
| `pnpm verify`                        | Format, lint, type, unit, build, and curriculum validation |
| `pnpm infra:up`                      | Start PostgreSQL and Redis                                 |
| `pnpm db:migrate` / `pnpm db:seed`   | Apply learner-owned schema and seed data                   |
| `pnpm test:e2e`                      | Run browser smoke tests                                    |
| `pnpm quest:list/status/start/check` | Drive campaign progression                                 |
| `pnpm mission-control`               | Launch the local learning dashboard on port 3100           |

The landing page is at `http://localhost:3000`, API health at `http://localhost:4000/api/v1/health`, and Swagger at `http://localhost:4000/docs`.

## Learning boundary

Only health endpoints, configuration primitives, shared UI, test harnesses, and infrastructure wiring exist. There is deliberately no user, authentication, game, queue, WebSocket, economy, or admin implementation. See [`AGENTS.md`](AGENTS.md) before asking any AI to help.

## License

This project is available under the [MIT License](LICENSE).
