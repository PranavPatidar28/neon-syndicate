# Security Contract

Threat model: untrusted browsers, replayed requests/jobs, credential stuffing, cross-tenant access, malicious input, accidental admin misuse, leaked logs, and stale WebSocket authorization.

Authentication quests must use Argon2id, short access JWTs, random rotated refresh tokens stored only as hashes, secure HttpOnly cookie delivery, CSRF defense, session-family replay response, revocation, generic login errors, rate limits, and lockout safeguards that cannot become trivial denial of service.

Authorization must be server-side and compose global roles, syndicate roles, ownership, and explicit policy checks. A hidden button is not authorization. Recheck authorization when joining socket rooms and for sensitive long-lived actions.

Validate DTOs with allowlists. Apply secure headers and strict CORS. Never expose stack traces in production. Redact authorization, cookies, password fields, tokens, secrets, and sensitive profile data from logs. Record administrative and high-risk actions with actor, target, reason, timestamp, request ID, and safe metadata.

Security acceptance includes privilege escalation, IDOR/cross-syndicate access, CSRF, brute force, replay, duplicate jobs, unsafe content, secret scanning, and dependency audit scenarios.
