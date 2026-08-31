import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  addEvidence,
  completeQuest,
  resetEngineForTests,
  saveReflection,
  startQuest,
  updateCheckpoint,
} from './server.js';

let fixture: string | undefined;

afterEach(async () => {
  resetEngineForTests();
  if (fixture) await rm(fixture, { recursive: true, force: true });
  fixture = undefined;
});

describe('campaign state transitions', () => {
  it('migrates legacy state, persists evidence, and blocks incomplete completion', async () => {
    fixture = await mkdtemp(path.join(tmpdir(), 'neon-engine-'));
    await mkdir(path.join(fixture, 'curriculum/week-01'), { recursive: true });
    await mkdir(path.join(fixture, 'learning'), { recursive: true });
    const questFile = 'curriculum/week-01/01-01-test.md';
    await writeFile(
      path.join(fixture, questFile),
      '# Test\n## Transmission\nBegin.\n## Learning objectives\n- Learn.\n## Prerequisite primer\nRead.\n## Required behavior\n- Build.\n## Explicit non-goals\n- Skip.\n## Acceptance contracts\nSafe.\n## Checkpoints\n1. **Model:** Design it.\n## Verification\nManual gate: Observe it.\n## Common failure modes and debugging questions\n- Why?\n## Hint ladder\n<details><summary>Hint 1 — Signal</summary>Think.</details>\n## Reflection gate\n- Explain the system clearly.\n## Optional stretch\nMore.',
      'utf8',
    );
    await writeFile(
      path.join(fixture, 'curriculum/manifest.json'),
      JSON.stringify({
        version: 1,
        campaign: 'Fixture',
        quests: [
          {
            id: '01-01',
            week: 1,
            type: 'core',
            title: 'Test',
            theme: 'Boot',
            xp: 100,
            next: null,
            checks: [],
            file: questFile,
          },
        ],
      }),
      'utf8',
    );
    await writeFile(
      path.join(fixture, 'learning/progress.json'),
      JSON.stringify({
        version: 1,
        campaignStartedAt: null,
        currentQuest: null,
        totalXp: 0,
        unlocked: ['01-01'],
        quests: {
          '01-01': {
            status: 'unlocked',
            passedChecks: [],
            reflection: null,
            startedAt: null,
            completedAt: null,
          },
        },
      }),
      'utf8',
    );
    resetEngineForTests(fixture);
    await startQuest('01-01');
    await updateCheckpoint('01-01', 'checkpoint-1', true);
    await addEvidence('01-01', {
      kind: 'manual',
      summary: 'Observed the behavior.',
    });
    await expect(completeQuest('01-01')).rejects.toThrow(
      'Answer every reflection',
    );
    await saveReflection('01-01', {
      'reflection-1': 'The system is explained with enough detail to pass.',
    });
    const completed = await completeQuest('01-01');
    expect(completed.totalXp).toBe(100);
    expect(completed.quests['01-01']?.status).toBe('completed');
    expect(
      JSON.parse(
        await readFile(path.join(fixture, 'learning/progress.json'), 'utf8'),
      ).version,
    ).toBe(2);
  });
});
