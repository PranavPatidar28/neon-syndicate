import { z } from 'zod';

export const questStatusSchema = z.enum([
  'locked',
  'unlocked',
  'in_progress',
  'completed',
]);

export const checkResultSchema = z.object({
  command: z.string(),
  passed: z.boolean(),
  checkedAt: z.string(),
  durationMs: z.number().optional(),
  runId: z.string().optional(),
});

export const evidenceSchema = z.object({
  id: z.string(),
  kind: z.enum(['manual', 'note', 'link']),
  summary: z.string().min(1),
  detail: z.string().default(''),
  createdAt: z.string(),
});

export const questProgressSchema = z.object({
  status: questStatusSchema,
  passedChecks: z.array(checkResultSchema).default([]),
  reflection: z.string().nullable().default(null),
  startedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  checkpoints: z.record(z.string(), z.boolean()).default({}),
  hintsRevealed: z.number().int().min(0).max(3).default(0),
  evidence: z.array(evidenceSchema).default([]),
  reflectionAnswers: z.record(z.string(), z.string()).default({}),
  journalPath: z.string().nullable().default(null),
  learnerConfirmedAt: z.string().nullable().default(null),
});

export const progressSchema = z.object({
  version: z.number().default(2),
  campaignStartedAt: z.string().nullable().default(null),
  currentQuest: z.string().nullable().default(null),
  totalXp: z.number().int().nonnegative().default(0),
  unlocked: z.array(z.string()).default(['01-01']),
  quests: z.record(z.string(), questProgressSchema),
  activity: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        questId: z.string().nullable(),
        message: z.string(),
        createdAt: z.string(),
      }),
    )
    .default([]),
  preferences: z
    .object({
      reducedMotion: z.boolean().default(false),
      sound: z.boolean().default(false),
    })
    .default({ reducedMotion: false, sound: false }),
});

export const manifestQuestSchema = z.object({
  id: z.string(),
  week: z.number().int(),
  type: z.enum(['core', 'debug', 'boss']),
  title: z.string(),
  theme: z.string(),
  xp: z.number().int(),
  next: z.string().nullable(),
  checks: z.array(z.string()),
  file: z.string(),
});

export const manifestSchema = z.object({
  version: z.number(),
  campaign: z.string(),
  quests: z.array(manifestQuestSchema),
});

export type Progress = z.infer<typeof progressSchema>;
export type QuestProgress = z.infer<typeof questProgressSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
export type ManifestQuest = z.infer<typeof manifestQuestSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;

export type QuestBrief = ManifestQuest & {
  transmission: string;
  objectives: string[];
  primer: string;
  requiredBehavior: string[];
  nonGoals: string[];
  checkpoints: { id: string; title: string; description: string }[];
  manualGate: string;
  hints: { level: number; title: string; body: string }[];
  reflections: { id: string; prompt: string }[];
  markdown: string;
};

export type CompletionGate = {
  automatedChecks: boolean;
  checkpoints: boolean;
  manualEvidence: boolean;
  reflections: boolean;
  ready: boolean;
  missing: string[];
};

export type RepositorySnapshot = {
  branch: string;
  status: string[];
  changedCount: number;
  stagedCount: number;
  untrackedCount: number;
  recentCommits: { hash: string; subject: string }[];
};

export type CommandRun = {
  id: string;
  questId: string;
  command: string;
  status: 'running' | 'passed' | 'failed' | 'cancelled';
  output: string;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number | null;
};

export type CampaignSnapshot = {
  manifest: Manifest;
  progress: Progress;
  quests: Array<QuestBrief & { progress: QuestProgress; gate: CompletionGate }>;
  repository: RepositorySnapshot;
  environment: {
    dockerAvailable: boolean;
    antigravityAvailable: boolean;
    mentorModel: string;
    editorAvailable: boolean;
    platform: string;
  };
};
