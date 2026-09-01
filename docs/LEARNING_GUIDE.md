# How to Learn with Neon Syndicate

Neon Syndicate is a 12-week, 48-quest full-stack engineering campaign. It is intentionally a **learning environment**, not a prewritten application or a list of tickets to finish as quickly as possible. The repository supplies architecture, contracts, infrastructure, tests, progression tooling, and coaching boundaries; you supply the product implementation and the reasoning behind it.

Use this guide to set up the project, run each quest correctly, ask for useful help without outsourcing the learning, and build evidence that you understand what you created.

## 1. Understand the two products

The repository contains two very different surfaces:

- **Mission Control** (`apps/mission-control`) is the already-built local learning dashboard. It displays quests, runs allowlisted checks, records evidence and reflections, and manages progression.
- **Neon Syndicate** (`apps/web`, `apps/api`, `apps/worker`, and supporting packages) is the product you build during the curriculum.

Do not add campaign maps, hints, XP, quest tracking, or other learning-management behavior to the learner-built product. Mission Control and the CLI share the authoritative progression rules in `packages/challenge-engine`.

## 2. Adopt the right learning contract

For every quest, aim to produce five things:

1. **A prediction:** describe the data flow, invariant, trust boundary, risks, and likely failure mode before coding.
2. **A contract:** define externally observable behavior with a schema, test, API/event contract, or acceptance example.
3. **A narrow implementation:** make the smallest production-shaped slice work without implementing later quests.
4. **Evidence:** save exact automated results and manually observe important success and failure paths.
5. **An explanation:** explain the design without reading the code, including a rejected alternative and when it would be better.

Passing tests is necessary, but it is not sufficient. A quest is complete only when its automated checks, checkpoints, manual evidence, reflection prompts, and mentor review all agree.

### Productive struggle is part of the project

Do not reveal all hints immediately or ask an AI for a complete solution as a first move. Use this escalation order:

1. Investigate and write down a hypothesis.
2. Ask for a **level 1 concept nudge**.
3. If still blocked, ask for a **level 2 subsystem/file trace and one experiment**.
4. If evidence is still insufficient, ask for a **level 3 pseudocode or focused test shape**.
5. Request implementation only if you deliberately choose to stop solving that named quest yourself.

The difficulty you can explain afterward is valuable; difficulty silently bypassed by copied code is not.

## 3. One-time setup

### Required tools

- Git
- Node.js `>=24.14.0 <25`
- pnpm `>=10.33.0 <11` (the repository pins pnpm `10.33.0`)
- A code editor; VS Code enables Mission Control's editor handoffs
- PostgreSQL and Redis credentials, normally from Neon plus Upstash or Redis Cloud
- Docker Desktop only if you choose the local infrastructure fallback

Confirm the important versions from PowerShell:

```powershell
node --version
pnpm --version
git --version
```

From the repository root, install dependencies:

```powershell
pnpm install
```

### Configure the normal managed-infrastructure path

Copy the environment template without overwriting an existing local file:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Then edit `.env`:

- `DATABASE_URL`: Neon's pooled application URL (the host normally contains `-pooler`)
- `DIRECT_URL`: Neon's direct URL for Prisma migrations
- `REDIS_URL`: a standard TLS Redis URL beginning with `rediss://`, not an HTTPS REST URL
- `NEXT_PUBLIC_API_URL`: normally `http://localhost:4000/api/v1`

Never commit `.env`, provider credentials, access tokens, or copied production data.

Validate the configured foundations:

```powershell
pnpm db:validate
pnpm db:generate
pnpm redis:check
```

Run migrations or seed data only when the active quest calls for them:

```powershell
pnpm db:migrate
pnpm db:seed
```

### Optional local Docker fallback

If you are not using managed providers:

```powershell
pnpm infra:docker:up
```

Set both PostgreSQL URLs to the local URL documented in `.env.example`, and set `REDIS_URL=redis://localhost:6379`. Stop the fallback with:

```powershell
pnpm infra:docker:down
```

PostgreSQL is authoritative application state. Redis is disposable coordination/cache state; application correctness must survive Redis loss or delay.

### Establish a clean baseline

Before starting a quest, run:

```powershell
pnpm verify
pnpm test:e2e
git status --short
```

If the baseline fails, save the exact failure and determine whether it is setup-related or pre-existing before changing product code. Never weaken or delete a test merely to make the gate green.

## 4. Start the learning interface

The recommended workflow is Mission Control:

```powershell
pnpm mission-control
```

Open <http://127.0.0.1:3100>. Keep this terminal running. Mission Control binds locally, rejects cross-origin mutations, and can execute only checks declared for the active quest.

Use a second terminal for product development:

```powershell
pnpm dev
```

The main local endpoints are:

| Surface               | URL                                   |
| --------------------- | ------------------------------------- |
| Mission Control       | <http://127.0.0.1:3100>               |
| Learner-built web app | <http://localhost:3000>               |
| API health            | <http://localhost:4000/api/v1/health> |
| Swagger/OpenAPI UI    | <http://localhost:4000/docs>          |

Mission Control is useful but optional. The equivalent read/start/check CLI commands are:

```powershell
pnpm quest:list
pnpm quest:status
pnpm quest:start -- 01-01
pnpm quest:check -- 01-01
```

`quest:check` runs the first pending allowlisted check for that quest and records its result. Running `pnpm verify`, `pnpm test`, or another underlying command directly is useful during development, but **does not record the quest gate**. Run the final gate through Mission Control or `quest:check`.

Do not edit `learning/progress.json` by hand during normal use. Mission Control and the challenge engine write it atomically and enforce sequential unlocking.

## 5. Follow this loop for every quest

### Step 1: Orient before coding

Run `pnpm quest:status`, open the active quest in `curriculum/week-XX/`, and read it completely. Extract:

- learning objectives;
- required behavior and explicit non-goals;
- API/event, data, UI, and operational acceptance contracts;
- checkpoint order;
- automated and manual verification;
- reflection questions.

Then read only the supporting material relevant to the quest:

1. `docs/ARCHITECTURE.md` for process and ownership boundaries;
2. `docs/DOMAIN.md` and `docs/GLOSSARY.md` for domain language;
3. `docs/SECURITY.md` for trust-boundary rules;
4. `docs/TESTING.md` for the appropriate proof level;
5. relevant records in `docs/adr/` for durable decisions;
6. current implementation and its existing tests.

Avoid reading future quest solutions into the current scope. Core quests are sequential, debugging encounters must be solved from evidence, and stretch work must not implement the next quest early.

### Step 2: Write the pre-code journal entry

Start from `learning/journal/TEMPLATE.md`. Before changing code, record:

- the end-to-end request/event/data flow;
- the authoritative source of truth;
- at least one invariant;
- trust boundaries and untrusted input;
- expected happy and failure paths;
- one implementation approach and one rejected alternative;
- the first test or observation that could falsify your design.

Mission Control's **Save reflection journal** action writes `learning/journal/YYYY-MM-DD-<quest-id>.md`. To ensure your ongoing design/work log is never confused with or replaced by that generated reflection file, keep working notes in a companion file such as `YYYY-MM-DD-<quest-id>-worklog.md`, then preserve the important conclusions in the final reflection.

### Step 3: Define proof before broad implementation

Choose the cheapest test that proves the actual risk:

- pure rule or state transition → unit test;
- constraint, transaction, concurrency, or idempotency → real PostgreSQL integration test;
- validation, authentication, authorization, versioning, or error envelope → HTTP test;
- retry, duplicate delivery, dead-letter, or restart behavior → worker test;
- socket authentication, room isolation, or recovery → socket integration test;
- critical keyboard/user journey → Playwright.

Do not mock away the boundary whose behavior you need to prove. Use explicit clocks/random sources, isolated records, unique identifiers, and stable ordering.

### Step 4: Implement the smallest vertical slice

Trace the complete path rather than filling one layer in isolation:

```text
browser or transport
  → controller/gateway validation
  → application/domain decision
  → Prisma transaction and authoritative rows
  → durable work/event when required
  → stable response or projection
  → observable UI state
```

At each boundary, ask:

- Who is the actor and where is authorization enforced?
- Which input is untrusted and where is it validated?
- What stable identity makes retries idempotent?
- What transaction protects the invariant?
- How does a caller distinguish success, rejection, delay, and dependency failure?
- What can be reconstructed if Redis or a process disappears?

Keep `/api/v1`, request IDs, error envelopes, pagination, OpenAPI, accessibility, and loading/empty/error/success states consistent with the repository contracts.

### Step 5: Work in short evidence loops

After each meaningful change:

1. predict what the focused check should show;
2. run the narrowest relevant test;
3. compare observation to prediction;
4. record surprising failures and changed hypotheses;
5. inspect the diff for accidental scope growth.

Useful commands include:

```powershell
pnpm --filter <workspace-name> test
pnpm --filter <workspace-name> typecheck
pnpm test
pnpm typecheck
pnpm lint
git diff --check
git diff --stat
git status --short
```

Do not wait until the end to discover that the wrong layer owns a rule or that an integration boundary was never exercised.

### Step 6: Use the hint ladder correctly

Before revealing or requesting a hint, write this blocker report:

```text
Expected:
Observed:
Evidence (test/log/request/diff):
Current hypothesis:
Smallest experiment already tried:
```

Ask a mentor or AI: “What should I inspect or predict next without giving me the complete solution?” Record the hint level used and whether the resulting experiment confirmed or rejected your hypothesis.

The optional Antigravity mentor in Mission Control follows the same hints-first contract. It is advisory only: it cannot edit files, run checks, mutate progress, or complete quests. Preview the redacted context carefully before approving transmission; do not include secrets or unnecessary files.

### Step 7: Verify behavior, not confidence

When the implementation appears complete:

1. Run the focused tests again.
2. Run the active quest's automated command through Mission Control or `pnpm quest:check -- <id>` so the result is recorded.
3. Perform every manual scenario in the quest brief.
4. Record manual evidence with the setup, action, expected result, observed result, and relevant log/request/UI state.
5. Review `git diff`, `git diff --check`, and `git status --short`.

A useful evidence entry is specific:

> With user A authenticated, submitted the same launch idempotency key twice concurrently. Both requests returned the documented response; one mission row and one ledger effect existed afterward. Observed at 2026-08-31 16:20 IST; integration test and SQL row counts attached.

“It works,” “tests pass,” or an unobserved expected result is not evidence.

### Step 8: Reflect and explain it back

Answer every reflection prompt with concrete detail. Be ready to explain without reading code:

- the complete request/event and data flow;
- the key invariant and all layers that enforce it;
- trust boundaries and authorization;
- transaction, retry, and failure behavior;
- why each test level matches its risk;
- what failed and which evidence changed your mind;
- one rejected alternative and the conditions that would make it preferable.

Ask a mentor to challenge the explanation with counterexamples: direct API access, wrong actor, malformed input, duplicate/concurrent calls, dependency outage, restart, and partial failure. Fix any gap that the explanation reveals.

### Step 9: Complete only after review

Mark checkpoints honestly, save at least one manual evidence record, save all reflection answers, and obtain the explain-it-back review. Only then use Mission Control's completion action. The engine awards XP and unlocks exactly the next manifest quest.

The CLI has `pnpm quest:complete -- <id>`, but it should not be used to bypass mentor review. It will still reject incomplete automated, checkpoint, manual-evidence, or reflection gates.

## 6. How to work with AI without losing the learning

AI agents in this repository must default to mentor mode. Start a help request with concrete evidence:

```text
I am working on quest 02-02. I expected <outcome>, observed <outcome>,
and ran <exact command>. Here is the relevant error/log and my current
hypothesis. Give me a level 1 nudge only; do not implement the quest.
```

Good requests ask the AI to:

- question your invariant or data-flow prediction;
- identify a missing test category;
- help interpret a specific error or log;
- suggest one discriminating experiment;
- review a diff for correctness, security, accessibility, or scope;
- conduct an explain-it-back interview;
- compare two designs after you have articulated both.

Avoid requests such as “do this quest,” “make all tests pass,” or “build authentication” unless you intentionally want implementation mode. If you do, authorization must name one quest explicitly:

```text
Switch to implementation mode for quest 03-01 only. Inspect my current
attempt, preserve unrelated changes, implement only that quest, run its
checks, and tell me what I should study afterward.
```

That permission ends with the named quest. Review every generated change and explain it yourself before accepting completion.

## 7. A sustainable 12-week cadence

Each week contains two core quests, one debugging encounter, and one boss battle. A productive rhythm is:

- **Session 1 — model:** read, draw the flow, state invariants, and identify risks;
- **Session 2 — contract:** write failing tests/contracts and implement the narrow path;
- **Session 3 — harden:** cover invalid, unauthorized, duplicate/concurrent, and dependency-failure paths;
- **Session 4 — prove:** run full gates, perform manual checks, explain, and review;
- **weekly review:** redraw the architecture from memory and summarize what changed in your mental model.

Prefer focused 60–90 minute sessions over a long copy-and-paste sprint. End each session with a small handoff in the journal:

```text
Current behavior:
Last command and result:
Open hypothesis:
Next smallest experiment:
Files intentionally changed:
```

If you cannot explain a completed week's boss battle a few days later, revisit it before adding more complexity.

## 8. Git and scope discipline

Use Git as an evidence and recovery tool:

- begin with `git status --short` and understand existing changes;
- keep one active quest's code and documentation together;
- inspect `git diff` before and after each checkpoint;
- stage explicit files rather than blindly staging the whole tree;
- do not mix infrastructure cleanup, refactors, and future features into a quest;
- write an ADR when changing a durable architectural decision;
- add migrations rather than rewriting deployed migration history;
- never commit secrets, generated local state, misleading evidence, or progress you did not earn.

A useful commit describes the behavior or invariant, not the XP or vague progress. Commit only after the repository is in a buildable, accurately documented state.

## 9. Common ways to learn less—and the correction

| Anti-pattern                                        | Why it fails                                          | Better practice                                       |
| --------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Coding before reading the quest's non-goals         | Implements future scope and hides the intended lesson | Write scope and non-goals in the journal first        |
| Revealing all hints immediately                     | Removes hypothesis formation                          | Reveal one level only after recording a blocker       |
| Asking AI for complete code                         | Produces code you may not be able to defend           | Ask for a question, experiment, or diff review        |
| Testing only the happy path                         | Misses trust, concurrency, and outage risks           | Derive negative tests from the invariant              |
| Mocking Prisma for transaction behavior             | Cannot prove database guarantees                      | Use PostgreSQL integration tests                      |
| Running a command but not recording the quest check | Leaves the progression gate incomplete                | Run the final check via Mission Control/`quest:check` |
| Treating Redis as authoritative                     | Makes cache/queue loss corrupt product truth          | Reconstruct from PostgreSQL and use idempotency       |
| Marking manual scenarios from expectation           | Creates false evidence                                | Record only behavior personally observed              |
| Chasing XP or stretch goals                         | Rewards breadth without mastery                       | Complete explanation and core gates first             |
| Silent architecture changes                         | Makes later quests and agents inconsistent            | Add or update an ADR with tradeoffs                   |

## 10. Recovery and troubleshooting

### Mission Control is unavailable

Use `pnpm quest:status`, `pnpm quest:start -- <id>`, `pnpm quest:check -- <id>`, and `pnpm quest:validate`. Product coding and tests do not depend on the dashboard.

### A check fails before your quest changes

Capture the exact command/output, inspect environment readiness, compare with the baseline, and avoid attributing an unobserved cause. Fix setup separately or document the known baseline failure before proceeding.

### Database or Redis is unavailable

Check `.env` protocol/host values without printing credentials. Run `pnpm db:validate`, `pnpm db:generate`, or `pnpm redis:check` as appropriate. Use the Docker fallback if provider access is unavailable, then repeat the same externally observable test.

### Progress appears wrong

Stop Mission Control and avoid concurrent manual edits. Run `pnpm quest:validate` and `pnpm quest:status`, inspect `learning/progress.json`, and recover it through Git only if you understand which recorded evidence would be lost. Do not fabricate a pass to repair progression.

### You are stuck for more than one session

Reduce the problem to one invariant and one counterexample. Reproduce it with the smallest test or request, compare actual and expected state at every boundary, then request the next hint level with that evidence.

## 11. Your first session

For a fresh campaign, do this in order:

```powershell
pnpm install
pnpm db:validate
pnpm db:generate
pnpm redis:check
pnpm verify
pnpm test:e2e
pnpm mission-control
```

Open Mission Control, inspect the campaign map, and start the currently unlocked quest (initially `01-01`). Read its full brief and the referenced architecture/security/testing/ADR documents. Create the pre-code work log, map the repository processes and dependencies, and identify what evidence would prove each process boundary before modifying code.

At the end of the session, you should have a falsifiable design and a next experiment—not necessarily finished code.

## 12. Definition of mastery

You are using this project properly when you can repeatedly:

- predict behavior before running it;
- locate authority and trust boundaries in a multi-process system;
- design tests around failure risk and invariants;
- diagnose from evidence rather than patch symptoms;
- keep retries, concurrency, and partial failure correct;
- preserve API, data, accessibility, and operational contracts;
- explain tradeoffs and rejected alternatives clearly;
- distinguish implemented, tested, observed, and merely planned behavior.

The final portfolio is valuable because of the engineering decisions you can defend, not because all 48 quest cards say “completed.”
