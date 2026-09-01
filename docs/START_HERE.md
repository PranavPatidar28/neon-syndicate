# Start Here

For the complete setup, quest workflow, mentoring, evidence, and study strategy, read [`LEARNING_GUIDE.md`](LEARNING_GUIDE.md).

## The loop

1. Run `pnpm mission-control`, open `http://127.0.0.1:3100`, and initialize the active quest.
2. Read its primer and write your initial design in `learning/journal/`.
3. Start the smallest checkpoint; keep feedback loops short.
4. Add tests before or with behavior. Use the hint ladder only after writing down the blocker.
5. Run `pnpm quest:check -- <id>` plus the quest's manual checks.
6. Answer the reflection prompts in a journal entry and explain the design to a mentor.
7. A mentor records acceptance and unlocks the next quest in `learning/progress.json`.

Mission Control is the recommended interface. It manages checkpoints, progressive hints, allowlisted checks with live logs, manual evidence, reflections, completion gates, repository state, editor handoffs, and optional AI mentoring. The CLI remains available for status and automation.

## Mission Control security

- It binds to `127.0.0.1` and rejects non-local or cross-origin mutations.
- It executes only commands declared for the active quest in `curriculum/manifest.json`; it is not a web terminal.
- It writes progress atomically and never auto-completes a quest from test results alone.
- Antigravity proxy mentoring is optional. Context is redacted, previewed, and hash-bound to explicit approval before transmission. The local proxy URL and model stay server-side.
- Product code editing remains in Codex or VS Code; the dashboard only opens repository files.

## Repository map

- `apps/web`: Next.js user experience and browser tests.
- `apps/api`: NestJS HTTP and, later, Socket.IO edge.
- `apps/worker`: standalone background processing boundary.
- `packages/database`: Prisma schema, migrations, client, and seed.
- `packages/contracts`: transport-neutral primitives and generated-client boundary.
- `packages/config`, `ui`, `test-utils`: validated configuration and reusable foundations.
- `curriculum`: 48 ordered challenges plus a machine-readable manifest.
- `docs`: product and engineering contracts; `docs/adr` records decisions.
- `learning`: progress, mentor rules, journal templates, and handoffs.

## Rules of engagement

Core work is sequential. Stretch goals never block progression. A debugging encounter must be solved from evidence before a mentor reveals its fault. Boss battles integrate the week and may not introduce undocumented scope. If an assumption becomes wrong, write an ADR instead of silently changing the contract.

## Definition of complete

Automated checks pass; manual scenarios are observed; security and accessibility acceptance criteria hold; the learner can explain data flow, invariants, tradeoffs, and one rejected alternative; progress and journal state are accurate.
