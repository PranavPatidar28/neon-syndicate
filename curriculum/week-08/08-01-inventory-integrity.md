# 08-01 — Inventory Integrity

**Week 8: Black-Market Ledger** · **CORE** · **100 XP**

## Transmission

The city needs you to **model item instances, equipment constraints, and atomic transfer**. Completion requires behavior, evidence, and explanation to agree.

## Learning objectives

- Apply inventory, balanced accounting, concurrency, and anti-exploit rules.
- Make trust boundaries and invariants explicit before implementation.
- Select tests based on failure risk, not implementation convenience.
- Explain one rejected design and when it would become preferable.

## Prerequisite primer

Review accounting postings, atomicity, locking, and reconciliation. Read the architecture, domain, security, testing, and relevant ADR documents. Journal your predicted data flow before coding.

## Required behavior

- Build one production-shaped slice while keeping later systems locked.
- Preserve `/api/v1`, request correlation, validated configuration, PostgreSQL authority, and provider-neutral URLs.
- Validate untrusted input and enforce authorization at the server boundary.
- Make failures observable; never convert an error into false success.

## Explicit non-goals

- Do not implement capabilities assigned to later weeks.
- Do not replace a domain rule with client-only checks, Redis authority, or unexplained mutable state.
- Do not optimize without a measured bottleneck except for correctness-critical constraints and indexes.

## Acceptance contracts

### API and events

Document shape, success status, stable machine error codes, authentication, authorization, and retry semantics. Update OpenAPI or event documentation and prove compatible behavior.

### Data

Document entities, ownership, constraints, transaction boundary, indexes, retention, and retry or idempotency behavior. Migrations remain additive and reviewable.

### UI and operations

Provide keyboard accessibility and explicit loading, empty, error, success, and retry states where UI exists. Operational work exposes safe logs or metrics and a recovery action.

## Checkpoints

1. **Model:** journal the flow, invariant, threat, and rejected alternative.
2. **Contract:** write failing tests and contract or schema changes before broad implementation.
3. **Minimum slice:** make the narrow happy path pass without bypassing validation.
4. **Hardening:** cover invalid, unauthorized, duplicate or concurrent, and dependency-failure cases.
5. **Proof:** run checks, perform manual scenarios, review the diff, and explain it back.

## Verification

Automated gate:

- `pnpm typecheck`
- `pnpm test`

Manual gate: Exercise happy path, invalid input, unauthorized input, and relevant retry or restart behavior.

Record exact commands, relevant output, and observed UI or API state. A test that was not run is not passing.

## Common failure modes and debugging questions

- A rule exists only in the UI or controller: where is it guaranteed under direct or concurrent access?
- A retry creates a second effect: which stable identity and transaction prove one effect?
- A mocked test passes but production fails: which real boundary was removed?
- An error is swallowed: how can users and operators distinguish delayed, rejected, and completed?
- A query relies on accidental order: which stable ordering and index support the contract?

## Hint ladder

<details><summary>Hint 1 — Signal</summary>Start from the invariant. Write a counterexample, then identify the authoritative boundary that must reject or serialize it.</details>

<details><summary>Hint 2 — Trace</summary>Trace browser or transport → controller or gateway → application or domain rule → Prisma transaction → response or event. Mark identity, authorization, idempotency, and observability.</details>

<details><summary>Hint 3 — Blueprint</summary>Arrange authoritative rows, act twice or concurrently or as the wrong actor, then assert one committed outcome and stable error or audit evidence. Keep transport translation outside the domain decision.</details>

## Reflection gate

- Explain the complete request or event and data flow without reading code.
- State the invariant and show the database and application controls enforcing it.
- What failed, and which evidence changed your mind?
- Which alternative did you reject and when would it be better?
- Show automated and manual evidence to a mentor.

## Optional stretch

Add one measurable improvement such as a property test, fault injection, accessibility audit, or benchmark without changing the next quest's required scope. Stretch work never blocks progression.
