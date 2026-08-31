# ADR 0005: Antigravity proxy is an advisory mentor boundary

- Status: accepted
- Decision: Mission Control may send an explicitly previewed and hash-approved context payload to the local Antigravity Claude Proxy through its Anthropic-compatible messages endpoint. The response is constrained to a coaching schema: diagnosis, prediction question, one experiment, success signal, and concept.
- Why: structured coaching makes the next action clearer while preserving productive struggle and preventing an open-ended model response from becoming an accidental solution dump.
- Consequence: The proxied model cannot edit files, execute checks, mutate progress, or complete quests. The deterministic challenge engine and learner evidence remain authoritative. The dashboard remains fully usable while the proxy is offline, and Mission Control carries no direct provider SDK or cloud API key.
