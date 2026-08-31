import { describe, expect, it } from 'vitest';
import { parseQuestBrief } from './parse.js';

describe('parseQuestBrief', () => {
  it('extracts learning gates from a quest document', () => {
    const brief = parseQuestBrief(
      {
        id: '01-01',
        week: 1,
        type: 'core',
        title: 'Recon',
        theme: 'Boot',
        xp: 100,
        next: null,
        checks: ['pnpm test'],
        file: 'quest.md',
      },
      '# Quest\n## Transmission\nHello\n## Learning objectives\n- Learn\n## Prerequisite primer\nRead\n## Required behavior\n- Build\n## Explicit non-goals\n- Skip\n## Acceptance contracts\nText\n## Checkpoints\n1. **Model:** Design it.\n## Verification\nManual gate: Verify it.\n## Common failure modes and debugging questions\n- Why?\n## Hint ladder\n<details><summary>Hint 1 — Signal</summary>Think.</details>\n## Reflection gate\n- Explain it.\n## Optional stretch\nMore',
    );
    expect(brief.checkpoints[0]?.title).toBe('Model');
    expect(brief.hints[0]?.body).toBe('Think.');
    expect(brief.reflections[0]?.prompt).toBe('Explain it.');
    expect(brief.manualGate).toBe('Verify it.');
  });
});
