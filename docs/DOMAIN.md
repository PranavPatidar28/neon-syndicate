# Domain Map

This is a conceptual map, not a ready-made schema. Each quest must derive constraints and indexes.

- **User / Session:** identity, global role, credentials, rotated refresh-session lineage and revocation.
- **Agent:** a user-owned playable operative with progression and equipment constraints.
- **Syndicate / Membership:** cooperative group, invitation lifecycle, role, and membership invariants.
- **MissionDefinition:** admin-authored rules and rewards; versioned behavior remains explainable.
- **MissionRun / Assignment:** server-controlled lifecycle and participating agents; client input never dictates outcomes.
- **Inventory:** owned item instances and equipment state.
- **LedgerEntry:** immutable balanced postings grouped by one transaction identifier.
- **CityEvent:** scheduled, active, or finished world modifier with bounded effect.
- **Notification:** durable user-facing delivery state and recovery cursor.
- **AuditLog:** append-only record of security-sensitive administrative action.

Important invariants: one active membership per syndicate/user pair; legal mission transitions only; no double reward; no negative spendable balance; every economic transaction balances; room subscriptions require current authorization.
