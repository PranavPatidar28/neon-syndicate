import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  completeQuest,
  findRepositoryRoot,
  getCampaignSnapshot,
  loadManifest,
  loadProgress,
  recordCheckResult,
  startQuest,
} from './server.js';

const [command = 'status', questId] = process.argv
  .slice(2)
  .filter((argument) => argument !== '--');

if (command === 'list') {
  const snapshot = await getCampaignSnapshot();
  for (const quest of snapshot.quests) {
    console.log(
      `${quest.id}  ${quest.progress.status.padEnd(11)} W${quest.week} ${quest.type.padEnd(5)} ${quest.title}`,
    );
  }
} else if (command === 'status') {
  const snapshot = await getCampaignSnapshot();
  console.log(`Campaign: ${snapshot.manifest.campaign}`);
  console.log(`XP: ${snapshot.progress.totalXp}`);
  console.log(`Current: ${snapshot.progress.currentQuest ?? 'none'}`);
  console.log(`Unlocked: ${snapshot.progress.unlocked.join(', ') || 'none'}`);
  console.log('Mission Control: http://127.0.0.1:3100');
} else if (command === 'start') {
  if (!questId) throw new Error('Pass a quest id.');
  await startQuest(questId);
  console.log(
    `Started ${questId}. Open Mission Control or its curriculum brief.`,
  );
} else if (command === 'check') {
  const progress = await loadProgress();
  const id = questId ?? progress.currentQuest;
  if (!id) throw new Error('Pass a quest id or start a quest first.');
  const quest = (await loadManifest()).quests.find((item) => item.id === id);
  if (!quest) throw new Error('Unknown quest.');
  const firstPending = quest.checks.find(
    (check) =>
      !progress.quests[id]?.passedChecks.some(
        (result) => result.command === check && result.passed,
      ),
  );
  if (!firstPending) {
    console.log(
      'All automated checks already pass. Complete the remaining gates in Mission Control.',
    );
  } else {
    const [binary, ...args] = firstPending.split(' ');
    if (!binary) throw new Error('Allowlisted command is empty.');
    const startedAt = Date.now();
    const result = spawnSync(binary, args, {
      cwd: await findRepositoryRoot(),
      stdio: 'inherit',
      shell: process.platform === 'win32',
      windowsHide: true,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    await recordCheckResult(
      id,
      firstPending,
      result.status === 0,
      Date.now() - startedAt,
    );
    if (result.status !== 0) process.exitCode = 1;
  }
} else if (command === 'complete') {
  if (!questId) throw new Error('Pass a quest id.');
  await completeQuest(questId);
  console.log(`Completed ${questId}.`);
} else if (command === 'validate') {
  const root = await findRepositoryRoot();
  const [manifest, progress] = await Promise.all([
    loadManifest(),
    loadProgress(),
  ]);
  const required = [
    '## Transmission',
    '## Learning objectives',
    '## Required behavior',
    '## Acceptance contracts',
    '## Verification',
    '## Hint ladder',
    '## Reflection gate',
  ];
  const ids = new Set<string>();
  for (const quest of manifest.quests) {
    if (ids.has(quest.id)) throw new Error(`Duplicate quest ${quest.id}`);
    ids.add(quest.id);
    const file = path.join(root, quest.file);
    await access(file);
    const markdown = await readFile(file, 'utf8');
    for (const section of required) {
      if (!markdown.includes(section))
        throw new Error(`${quest.file} missing ${section}`);
    }
    if (!progress.quests[quest.id])
      throw new Error(`Progress missing ${quest.id}`);
  }
  if (manifest.quests.length !== 48) {
    throw new Error(`Expected 48 quests, found ${manifest.quests.length}`);
  }
  console.log('Curriculum valid: 48 challenges and progress records.');
} else {
  throw new Error(`Unknown command: ${command}`);
}
