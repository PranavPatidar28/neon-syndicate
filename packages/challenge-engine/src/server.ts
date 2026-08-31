import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  evidenceSchema,
  manifestSchema,
  progressSchema,
  type CampaignSnapshot,
  type CommandRun,
  type CompletionGate,
  type Progress,
  type QuestBrief,
  type QuestProgress,
  type RepositorySnapshot,
} from './index.js';
import { parseQuestBrief } from './parse.js';

let cachedRoot: string | undefined;
const globalRuns = globalThis as typeof globalThis & {
  __neonCommandRuns?: Map<string, CommandRun & { child?: ChildProcess }>;
  __neonMutationQueue?: Promise<void>;
};
const runs = (globalRuns.__neonCommandRuns ??= new Map());
globalRuns.__neonMutationQueue ??= Promise.resolve();
const SAFE_COMMANDS = new Set([
  'pnpm verify',
  'pnpm typecheck',
  'pnpm test',
  'pnpm build',
  'pnpm lint',
]);

export async function findRepositoryRoot(
  start = process.cwd(),
): Promise<string> {
  if (cachedRoot) return cachedRoot;
  let cursor = path.resolve(process.env.NEON_REPO_ROOT ?? start);
  while (true) {
    try {
      await access(path.join(cursor, 'curriculum/manifest.json'));
      cachedRoot = cursor;
      return cursor;
    } catch {
      const parent = path.dirname(cursor);
      if (parent === cursor)
        throw new Error('Could not locate Neon Syndicate repository root.');
      cursor = parent;
    }
  }
}

const readJson = async (file: string): Promise<unknown> =>
  JSON.parse(await readFile(file, 'utf8'));

export async function loadManifest() {
  const root = await findRepositoryRoot();
  return manifestSchema.parse(
    await readJson(path.join(root, 'curriculum/manifest.json')),
  );
}

function migrateProgress(raw: unknown): Progress {
  const source = raw as Record<string, unknown>;
  return progressSchema.parse({ ...source, version: 2 });
}

export async function loadProgress(): Promise<Progress> {
  const root = await findRepositoryRoot();
  return migrateProgress(
    await readJson(path.join(root, 'learning/progress.json')),
  );
}

export async function saveProgress(progress: Progress): Promise<void> {
  const root = await findRepositoryRoot();
  const target = path.join(root, 'learning/progress.json');
  const temp = `${target}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(
    temp,
    `${JSON.stringify(progressSchema.parse(progress), null, 2)}\n`,
    'utf8',
  );
  await rename(temp, target);
}

export async function loadQuestBrief(questId: string): Promise<QuestBrief> {
  const root = await findRepositoryRoot();
  const manifest = await loadManifest();
  const meta = manifest.quests.find((quest) => quest.id === questId);
  if (!meta) throw new Error(`Unknown quest: ${questId}`);
  return parseQuestBrief(
    meta,
    await readFile(
      path.join(/* turbopackIgnore: true */ root, meta.file),
      'utf8',
    ),
  );
}

export function getCompletionGate(
  brief: QuestBrief,
  progress: QuestProgress,
): CompletionGate {
  const automatedChecks = brief.checks.every((command) =>
    progress.passedChecks.some(
      (check) => check.command === command && check.passed,
    ),
  );
  const checkpoints = brief.checkpoints.every(
    (checkpoint) => progress.checkpoints[checkpoint.id],
  );
  const manualEvidence = progress.evidence.some(
    (item) => item.kind === 'manual',
  );
  const reflections = brief.reflections.every(
    (reflection) =>
      (progress.reflectionAnswers[reflection.id]?.trim().length ?? 0) >= 20,
  );
  const missing = [
    ...(!automatedChecks ? ['Pass every automated check'] : []),
    ...(!checkpoints ? ['Complete every checkpoint'] : []),
    ...(!manualEvidence ? ['Add manual verification evidence'] : []),
    ...(!reflections ? ['Answer every reflection with meaningful detail'] : []),
  ];
  return {
    automatedChecks,
    checkpoints,
    manualEvidence,
    reflections,
    ready: missing.length === 0,
    missing,
  };
}

async function mutateProgress(
  mutator: (progress: Progress) => Promise<void> | void,
): Promise<Progress> {
  const operation = globalRuns.__neonMutationQueue!.then(async () => {
    const progress = await loadProgress();
    await mutator(progress);
    await saveProgress(progress);
    return progress;
  });
  globalRuns.__neonMutationQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

function activity(
  progress: Progress,
  type: string,
  message: string,
  questId: string | null,
) {
  progress.activity.unshift({
    id: randomUUID(),
    type,
    questId,
    message,
    createdAt: new Date().toISOString(),
  });
  progress.activity = progress.activity.slice(0, 100);
}

export async function startQuest(questId: string): Promise<Progress> {
  const manifest = await loadManifest();
  if (!manifest.quests.some((quest) => quest.id === questId))
    throw new Error('Unknown quest.');
  return mutateProgress((progress) => {
    if (!progress.unlocked.includes(questId))
      throw new Error('This quest is locked.');
    if (progress.currentQuest && progress.currentQuest !== questId)
      throw new Error(`Finish ${progress.currentQuest} first.`);
    const record = progress.quests[questId];
    if (!record) throw new Error('Progress record is missing.');
    progress.currentQuest = questId;
    progress.campaignStartedAt ??= new Date().toISOString();
    record.status = 'in_progress';
    record.startedAt ??= new Date().toISOString();
    activity(progress, 'quest.started', `Started ${questId}`, questId);
  });
}

export async function updateCheckpoint(
  questId: string,
  checkpointId: string,
  completed: boolean,
) {
  const brief = await loadQuestBrief(questId);
  if (!brief.checkpoints.some((item) => item.id === checkpointId))
    throw new Error('Unknown checkpoint.');
  return mutateProgress((progress) => {
    const record = progress.quests[questId];
    if (!record || record.status !== 'in_progress')
      throw new Error('Start this quest first.');
    record.checkpoints[checkpointId] = completed;
    activity(
      progress,
      'checkpoint.updated',
      `${completed ? 'Completed' : 'Reopened'} ${checkpointId}`,
      questId,
    );
  });
}

export async function revealHint(questId: string) {
  const brief = await loadQuestBrief(questId);
  return mutateProgress((progress) => {
    const record = progress.quests[questId];
    if (!record || record.status !== 'in_progress')
      throw new Error('Start this quest first.');
    if (record.hintsRevealed >= brief.hints.length)
      throw new Error('All hints are already revealed.');
    record.hintsRevealed += 1;
    activity(
      progress,
      'hint.revealed',
      `Revealed hint level ${record.hintsRevealed}`,
      questId,
    );
  });
}

export async function addEvidence(
  questId: string,
  input: { kind: 'manual' | 'note' | 'link'; summary: string; detail?: string },
) {
  const item = evidenceSchema.parse({
    ...input,
    detail: input.detail ?? '',
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  });
  return mutateProgress((progress) => {
    const record = progress.quests[questId];
    if (!record || record.status !== 'in_progress')
      throw new Error('Start this quest first.');
    record.evidence.push(item);
    activity(progress, 'evidence.added', item.summary, questId);
  });
}

export async function saveReflection(
  questId: string,
  answers: Record<string, string>,
) {
  const brief = await loadQuestBrief(questId);
  const allowed = new Set(brief.reflections.map((item) => item.id));
  return mutateProgress(async (progress) => {
    const record = progress.quests[questId];
    if (!record || record.status !== 'in_progress')
      throw new Error('Start this quest first.');
    record.reflectionAnswers = Object.fromEntries(
      Object.entries(answers).filter(([key]) => allowed.has(key)),
    );
    const root = await findRepositoryRoot();
    const journalPath = `learning/journal/${new Date().toISOString().slice(0, 10)}-${questId}.md`;
    const body = [
      `# Quest ${questId}: ${brief.title}`,
      '',
      '## Reflection',
      '',
      ...brief.reflections.flatMap((item) => [
        `### ${item.prompt}`,
        '',
        record.reflectionAnswers[item.id] ?? '',
        '',
      ]),
    ].join('\n');
    await mkdir(path.dirname(path.join(root, journalPath)), {
      recursive: true,
    });
    await writeFile(path.join(root, journalPath), body, 'utf8');
    record.journalPath = journalPath;
    record.reflection = body;
    activity(progress, 'reflection.saved', 'Saved reflection draft', questId);
  });
}

export async function completeQuest(questId: string): Promise<Progress> {
  const brief = await loadQuestBrief(questId);
  return mutateProgress((progress) => {
    const record = progress.quests[questId];
    if (!record || record.status !== 'in_progress')
      throw new Error('Only an active quest can be completed.');
    const gate = getCompletionGate(brief, record);
    if (!gate.ready)
      throw new Error(`Completion blocked: ${gate.missing.join('; ')}`);
    const now = new Date().toISOString();
    record.status = 'completed';
    record.completedAt = now;
    record.learnerConfirmedAt = now;
    progress.currentQuest = null;
    progress.totalXp += brief.xp;
    progress.unlocked = progress.unlocked.filter((id) => id !== questId);
    if (brief.next) {
      progress.unlocked.push(brief.next);
      const nextRecord = progress.quests[brief.next];
      if (nextRecord) nextRecord.status = 'unlocked';
    }
    activity(
      progress,
      'quest.completed',
      `Completed ${questId} for ${brief.xp} XP`,
      questId,
    );
  });
}

export async function recordCheckResult(
  questId: string,
  command: string,
  passed: boolean,
  durationMs: number,
): Promise<Progress> {
  const quest = (await loadManifest()).quests.find(
    (item) => item.id === questId,
  );
  if (
    !quest ||
    !quest.checks.includes(command) ||
    !SAFE_COMMANDS.has(command)
  ) {
    throw new Error('Command is not allowlisted for this quest.');
  }
  return mutateProgress((progress) => {
    const record = progress.quests[questId];
    if (!record || record.status !== 'in_progress') {
      throw new Error('Start this quest first.');
    }
    record.passedChecks = record.passedChecks.filter(
      (item) => item.command !== command,
    );
    record.passedChecks.push({
      command,
      passed,
      checkedAt: new Date().toISOString(),
      durationMs,
    });
    activity(
      progress,
      'check.finished',
      `${command}: ${passed ? 'passed' : 'failed'}`,
      questId,
    );
  });
}

function git(root: string, args: string[]): string {
  return (
    spawnSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      windowsHide: true,
    }).stdout?.trim() ?? ''
  );
}

export async function getRepositorySnapshot(): Promise<RepositorySnapshot> {
  const root = await findRepositoryRoot();
  const status = git(root, ['status', '--porcelain'])
    .split('\n')
    .filter(Boolean);
  return {
    branch: git(root, ['branch', '--show-current']) || 'unborn/main',
    status,
    changedCount: status.length,
    stagedCount: status.filter(
      (line) => line[0] && line[0] !== ' ' && line[0] !== '?',
    ).length,
    untrackedCount: status.filter((line) => line.startsWith('??')).length,
    recentCommits: git(root, ['log', '-5', '--pretty=format:%h%x09%s'])
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash = '', ...subject] = line.split('\t');
        return { hash, subject: subject.join('\t') };
      }),
  };
}

export async function getCampaignSnapshot(): Promise<CampaignSnapshot> {
  const [manifest, progress, repository] = await Promise.all([
    loadManifest(),
    loadProgress(),
    getRepositorySnapshot(),
  ]);
  const quests = await Promise.all(
    manifest.quests.map(async (meta) => {
      const brief = await loadQuestBrief(meta.id);
      const record = progress.quests[meta.id];
      if (!record) throw new Error(`Progress missing ${meta.id}`);
      return {
        ...brief,
        progress: record,
        gate: getCompletionGate(brief, record),
      };
    }),
  );
  const editor = spawnSync(
    process.platform === 'win32' ? 'where.exe' : 'which',
    ['code'],
    { encoding: 'utf8', windowsHide: true },
  );
  const docker = spawnSync('docker', ['--version'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  const antigravityBaseUrl = (
    process.env.ANTIGRAVITY_BASE_URL ?? 'http://localhost:8080'
  ).replace(/\/+$/, '');
  const proxyProbe = new AbortController();
  const proxyProbeTimeout = setTimeout(() => proxyProbe.abort(), 1_500);
  let antigravityAvailable = false;
  try {
    const response = await fetch(antigravityBaseUrl, {
      method: 'HEAD',
      signal: proxyProbe.signal,
    });
    antigravityAvailable = response.ok;
    await response.body?.cancel();
  } catch {
    antigravityAvailable = false;
  } finally {
    clearTimeout(proxyProbeTimeout);
  }
  return {
    manifest,
    progress,
    quests,
    repository,
    environment: {
      dockerAvailable: docker.status === 0,
      antigravityAvailable,
      mentorModel:
        process.env.ANTIGRAVITY_MENTOR_MODEL ?? 'gemini-3.6-flash-high',
      editorAvailable: editor.status === 0,
      platform: process.platform,
    },
  };
}

export async function startCommandRun(
  questId: string,
  command: string,
): Promise<CommandRun> {
  const root = await findRepositoryRoot();
  const quest = (await loadManifest()).quests.find(
    (item) => item.id === questId,
  );
  if (!quest || !quest.checks.includes(command) || !SAFE_COMMANDS.has(command))
    throw new Error('Command is not allowlisted for this quest.');
  if (Array.from(runs.values()).some((run) => run.status === 'running'))
    throw new Error('Another check is already running.');
  const [binary, ...args] = command.split(' ');
  if (!binary) throw new Error('Allowlisted command is empty.');
  const child = spawn(binary, args, {
    cwd: root,
    shell: process.platform === 'win32',
    windowsHide: true,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  const run: CommandRun & { child?: ChildProcess } = {
    id: randomUUID(),
    questId,
    command,
    status: 'running',
    output: '',
    startedAt: new Date().toISOString(),
    child,
  };
  runs.set(run.id, run);
  const append = (data: Buffer) => {
    run.output = `${run.output}${data.toString()}`.slice(-100_000);
  };
  child.stdout?.on('data', append);
  child.stderr?.on('data', append);
  child.on('close', async (code) => {
    run.finishedAt = new Date().toISOString();
    run.exitCode = code;
    if (run.status !== 'cancelled')
      run.status = code === 0 ? 'passed' : 'failed';
    delete run.child;
    await mutateProgress((progress) => {
      const record = progress.quests[questId];
      if (!record) return;
      record.passedChecks = record.passedChecks.filter(
        (item) => item.command !== command,
      );
      record.passedChecks.push({
        command,
        passed: run.status === 'passed',
        checkedAt: run.finishedAt!,
        durationMs: Date.parse(run.finishedAt!) - Date.parse(run.startedAt),
        runId: run.id,
      });
      activity(
        progress,
        'check.finished',
        `${command}: ${run.status}`,
        questId,
      );
    });
  });
  return publicRun(run);
}

const publicRun = (run: CommandRun & { child?: ChildProcess }): CommandRun => {
  const safe = { ...run };
  delete safe.child;
  return safe;
};
export function getCommandRun(id: string): CommandRun | null {
  const run = runs.get(id);
  return run ? publicRun(run) : null;
}
export function cancelCommandRun(id: string): CommandRun | null {
  const run = runs.get(id);
  if (!run || run.status !== 'running') return run ? publicRun(run) : null;
  run.status = 'cancelled';
  if (run.child?.pid && process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(run.child.pid), '/t', '/f'], {
      windowsHide: true,
    });
  } else {
    run.child?.kill('SIGTERM');
  }
  return publicRun(run);
}

export function resetEngineForTests(repositoryRoot?: string): void {
  cachedRoot = repositoryRoot;
  runs.clear();
  globalRuns.__neonMutationQueue = Promise.resolve();
}

export async function openInEditor(relativePath: string): Promise<void> {
  const root = await findRepositoryRoot();
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(`${root}${path.sep}`))
    throw new Error('Path escapes repository root.');
  await access(target);
  const result = spawn('code', ['-g', target], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  result.unref();
}

export async function buildMentorContext(
  questId: string,
  question: string,
  selectedFiles: string[],
) {
  const root = await findRepositoryRoot();
  const [brief, progress, repository] = await Promise.all([
    loadQuestBrief(questId),
    loadProgress(),
    getRepositorySnapshot(),
  ]);
  const files = [];
  for (const relative of selectedFiles.slice(0, 8)) {
    const target = path.resolve(root, relative);
    if (!target.startsWith(`${root}${path.sep}`)) continue;
    try {
      files.push({
        path: relative,
        content: (
          await readFile(/* turbopackIgnore: true */ target, 'utf8')
        ).slice(0, 20_000),
      });
    } catch {
      /* unavailable files are omitted */
    }
  }
  const secretPattern =
    /(sk-[a-zA-Z0-9_-]{12,}|(?:password|secret|token|api[_-]?key)\s*[:=]\s*[^\s]+)/gi;
  const payload = {
    mode: 'hints-first',
    quest: {
      id: brief.id,
      title: brief.title,
      transmission: brief.transmission,
      objectives: brief.objectives,
      requiredBehavior: brief.requiredBehavior,
      hintsAlreadyRevealed: progress.quests[questId]?.hintsRevealed ?? 0,
    },
    learnerQuestion: question,
    repository,
    files,
  };
  const text = JSON.stringify(payload, null, 2).replace(
    secretPattern,
    '[REDACTED]',
  );
  return {
    payload: JSON.parse(text) as unknown,
    characterCount: text.length,
    files: files.map((file) => file.path),
  };
}
