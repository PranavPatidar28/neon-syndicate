import { describe, expect, it } from 'vitest';
import { getCompletionGate } from './server.js';
import type { QuestBrief, QuestProgress } from './index.js';

describe('completion gate', () => {
  it('requires checks, checkpoints, manual evidence, and reflections', () => {
    const brief = {
      id: '01-01',
      checks: ['pnpm test'],
      checkpoints: [{ id: 'checkpoint-1', title: 'Model', description: '' }],
      reflections: [{ id: 'reflection-1', prompt: 'Explain' }],
    } as QuestBrief;
    const progress = {
      status: 'in_progress',
      passedChecks: [],
      checkpoints: {},
      evidence: [],
      reflectionAnswers: {},
      hintsRevealed: 0,
      reflection: null,
      startedAt: null,
      completedAt: null,
      journalPath: null,
      learnerConfirmedAt: null,
    } as QuestProgress;
    expect(getCompletionGate(brief, progress).ready).toBe(false);
    progress.passedChecks = [
      {
        command: 'pnpm test',
        passed: true,
        checkedAt: new Date().toISOString(),
      },
    ];
    progress.checkpoints['checkpoint-1'] = true;
    progress.evidence.push({
      id: 'e',
      kind: 'manual',
      summary: 'Verified',
      detail: '',
      createdAt: new Date().toISOString(),
    });
    progress.reflectionAnswers['reflection-1'] =
      'A sufficiently detailed explanation.';
    expect(getCompletionGate(brief, progress).ready).toBe(true);
  });
});
