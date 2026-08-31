# Mission Control

Mission Control is a local learning control plane at `http://127.0.0.1:3100`. It is deliberately separate from `apps/web`, the player-facing game application built during the curriculum.

## Capabilities

- Campaign map and XP progression across all 48 challenges.
- Parsed quest briefs, checkpoints, hint ladder, checks, evidence, and reflection gates.
- Allowlisted, cancellable command runs with bounded live output.
- Atomic `learning/progress.json` updates and Markdown journal generation.
- Repository status, environment readiness, recent history, and VS Code deep links.
- Agent handoff prompts that work with any coding agent.
- A deterministic learning compass that recommends the next unfinished gate.
- Optional Antigravity proxy mentor with structured hints, exact context preview, and explicit approval.

## Optional Antigravity proxy mentor

Start Antigravity Claude Proxy and set `ANTIGRAVITY_BASE_URL` and optionally `ANTIGRAVITY_MENTOR_MODEL` in the root `.env`, then restart Mission Control. The defaults are `http://localhost:8080` and `gemini-3.6-flash-high`, a model currently exposed by the proxy. Every request requires a newly generated context preview; the send route recomputes and checks its SHA-256 hash so changed context cannot be sent under an old approval.

The adapter uses native `fetch` against the proxy's Anthropic-compatible `POST /v1/messages` endpoint; no provider SDK or cloud API key is included in Mission Control. It requests JSON containing a diagnosis, one prediction question, one small experiment, and an observable success signal, then validates that response locally. The context builder remains provider-neutral and the agent-handoff path works while the proxy is offline. Mission Control never grants the model permission to edit code, run commands, or complete a quest.

The learning compass is deterministic and does not call Antigravity. It guides the learner through checkpoints, automated checks, manual evidence, and reflection in that order.

## State and recovery

The checked-in progress file remains authoritative and portable. Writes use a temporary sibling followed by atomic rename. Journal files are ordinary Markdown. If Mission Control is unavailable, `pnpm quest:status`, `quest:start`, `quest:check`, and `quest:validate` use the same engine.
