import type { CampaignSnapshot } from '@neon/challenge-engine';

type Quest = CampaignSnapshot['quests'][number];

export type LearningMove = {
  label: string;
  detail: string;
  destination: 'quest' | 'mentor';
};

export function getNextLearningMove(quest: Quest): LearningMove {
  if (quest.progress.status === 'unlocked')
    return {
      label: 'Initialize the quest',
      detail: 'Read the primer, then write your initial design before coding.',
      destination: 'quest',
    };

  const checkpoint = quest.checkpoints.find(
    (item) => !quest.progress.checkpoints[item.id],
  );
  if (checkpoint)
    return {
      label: checkpoint.title,
      detail: checkpoint.description,
      destination: 'quest',
    };

  if (!quest.gate.automatedChecks)
    return {
      label: 'Run the automated gates',
      detail:
        'Use the failing output as evidence; do not patch around the test.',
      destination: 'quest',
    };
  if (!quest.gate.manualEvidence)
    return {
      label: 'Observe the manual scenario',
      detail: quest.manualGate,
      destination: 'quest',
    };
  if (!quest.gate.reflections)
    return {
      label: 'Explain the design back',
      detail:
        'Describe the flow, invariant, failure behavior, and one alternative.',
      destination: 'quest',
    };
  if (quest.gate.ready)
    return {
      label: 'Review and complete',
      detail: 'Confirm the evidence is accurate before accepting the XP.',
      destination: 'quest',
    };
  return {
    label: 'Diagnose the blocker',
    detail:
      'Bring the expected outcome, observed behavior, and concrete evidence.',
    destination: 'mentor',
  };
}
