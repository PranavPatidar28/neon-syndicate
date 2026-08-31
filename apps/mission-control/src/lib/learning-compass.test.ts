import { describe, expect, it } from 'vitest';
import type { CampaignSnapshot } from '@neon/challenge-engine';
import { getNextLearningMove } from './learning-compass';

const quest = {
  progress: { status: 'in_progress', checkpoints: {} },
  checkpoints: [
    {
      id: 'checkpoint-1',
      title: 'Model it',
      description: 'Draw the boundary.',
    },
  ],
  gate: {
    automatedChecks: false,
    checkpoints: false,
    manualEvidence: false,
    reflections: false,
    ready: false,
    missing: [],
  },
  manualGate: 'Observe the boundary.',
} as unknown as CampaignSnapshot['quests'][number];

describe('learning compass', () => {
  it('prioritizes the first unfinished checkpoint', () => {
    expect(getNextLearningMove(quest).label).toBe('Model it');
  });

  it('moves from checks to evidence to reflection in gate order', () => {
    const progressed = structuredClone(quest);
    progressed.progress.checkpoints['checkpoint-1'] = true;
    expect(getNextLearningMove(progressed).label).toBe(
      'Run the automated gates',
    );
    progressed.gate.automatedChecks = true;
    expect(getNextLearningMove(progressed).label).toBe(
      'Observe the manual scenario',
    );
    progressed.gate.manualEvidence = true;
    expect(getNextLearningMove(progressed).label).toBe(
      'Explain the design back',
    );
  });
});
