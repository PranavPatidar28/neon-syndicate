import type { ManifestQuest, QuestBrief } from './index.js';

function section(
  markdown: string,
  title: string,
  nextTitles: string[],
): string {
  const start = markdown.indexOf(`## ${title}`);
  if (start < 0) return '';
  const bodyStart = start + title.length + 3;
  const endings = nextTitles
    .map((next) => markdown.indexOf(`## ${next}`, bodyStart))
    .filter((value) => value >= 0);
  const end = endings.length > 0 ? Math.min(...endings) : markdown.length;
  return markdown.slice(bodyStart, end).trim();
}

function bullets(value: string): string[] {
  return value
    .split('\n')
    .filter((line) => /^- /.test(line.trim()))
    .map((line) => line.trim().slice(2).trim());
}

export function parseQuestBrief(
  meta: ManifestQuest,
  markdown: string,
): QuestBrief {
  const checkpointLines = section(markdown, 'Checkpoints', ['Verification'])
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\. /.test(line));
  const checkpoints = checkpointLines.map((line, index) => {
    const match = line.match(/^\d+\. \*\*(.+?):\*\*\s*(.*)$/);
    return {
      id: `checkpoint-${index + 1}`,
      title: match?.[1] ?? `Checkpoint ${index + 1}`,
      description: match?.[2] ?? line.replace(/^\d+\.\s*/, ''),
    };
  });
  const hintSection = section(markdown, 'Hint ladder', ['Reflection gate']);
  const hints = [
    ...hintSection.matchAll(
      /<details><summary>Hint (\d+) — ([^<]+)<\/summary>(.*?)<\/details>/gs,
    ),
  ].map((match) => ({
    level: Number(match[1]),
    title: (match[2] ?? '').trim(),
    body: (match[3] ?? '').trim(),
  }));
  const reflections = bullets(
    section(markdown, 'Reflection gate', ['Optional stretch']),
  ).map((prompt, index) => ({ id: `reflection-${index + 1}`, prompt }));
  const verification = section(markdown, 'Verification', [
    'Common failure modes and debugging questions',
  ]);
  const manualGate =
    verification.match(/Manual gate:\s*(.+)/)?.[1]?.trim() ?? '';

  return {
    ...meta,
    transmission: section(markdown, 'Transmission', ['Learning objectives']),
    objectives: bullets(
      section(markdown, 'Learning objectives', ['Prerequisite primer']),
    ),
    primer: section(markdown, 'Prerequisite primer', ['Required behavior']),
    requiredBehavior: bullets(
      section(markdown, 'Required behavior', ['Explicit non-goals']),
    ),
    nonGoals: bullets(
      section(markdown, 'Explicit non-goals', ['Acceptance contracts']),
    ),
    checkpoints,
    manualGate,
    hints,
    reflections,
    markdown,
  };
}
