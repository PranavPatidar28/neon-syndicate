'use client';

import type { CampaignSnapshot, CommandRun } from '@neon/challenge-engine';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getNextLearningMove } from '@/lib/learning-compass';
import type { MentorResponse } from '@/lib/mentor-response';

type View = 'command' | 'campaign' | 'quest' | 'mentor' | 'repository';
type QuestView = CampaignSnapshot['quests'][number];

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(body.error ?? 'Mission Control request failed.');
  return body;
}

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <span className="glyph" aria-hidden>
      {children}
    </span>
  );
}
function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>{label}</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function MissionControl() {
  const [snapshot, setSnapshot] = useState<CampaignSnapshot | null>(null);
  const [view, setView] = useState<View>('command');
  const [selectedId, setSelectedId] = useState('01-01');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const data = await request<CampaignSnapshot>('/api/snapshot');
      setSnapshot(data);
      if (data.progress.currentQuest) setSelectedId(data.progress.currentQuest);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Failed to load Mission Control.',
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (payload: Record<string, unknown>) => {
      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        await request('/api/action', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await load();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Action failed.');
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  if (!snapshot)
    return (
      <main className="loading">
        <div className="scanner" />
        <p>CONNECTING TO LOCAL CAMPAIGN STATE…</p>
        {error && <p className="error-box">{error}</p>}
      </main>
    );
  const selected =
    snapshot.quests.find((quest) => quest.id === selectedId) ??
    snapshot.quests[0]!;
  const completed = snapshot.quests.filter(
    (quest) => quest.progress.status === 'completed',
  ).length;
  const overall = (completed / snapshot.quests.length) * 100;
  const nav: Array<[View, string, string]> = [
    ['command', '⌂', 'Command'],
    ['campaign', '◈', 'Campaign'],
    ['quest', '⌁', 'Active quest'],
    ['mentor', '✦', 'Mentor'],
    ['repository', '⌘', 'Repository'],
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">NS</div>
          <div>
            <strong>
              NEON
              <br />
              SYNDICATE
            </strong>
            <span>MISSION CONTROL</span>
          </div>
        </div>
        <nav aria-label="Mission Control sections">
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              className={view === id ? 'active' : ''}
              onClick={() => setView(id)}
            >
              <Glyph>{icon}</Glyph>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span className="pulse" />
          <div>
            <small>LOCAL ENGINE</small>
            <strong>ONLINE</strong>
          </div>
        </div>
        <div className="operator">
          <div className="avatar">P</div>
          <div>
            <strong>Operator</strong>
            <span>Level {Math.floor(snapshot.progress.totalXp / 500) + 1}</span>
          </div>
          <b>{snapshot.progress.totalXp} XP</b>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">{view.toUpperCase()} // LOCAL-FIRST</span>
            <h1>
              {view === 'command'
                ? 'Operations deck'
                : view === 'campaign'
                  ? 'Campaign map'
                  : view === 'quest'
                    ? selected.title
                    : view === 'mentor'
                      ? 'Mentor uplink'
                      : 'Repository radar'}
            </h1>
          </div>
          <div className="top-actions">
            <Pill tone={snapshot.repository.changedCount ? 'amber' : 'green'}>
              {snapshot.repository.changedCount} workspace changes
            </Pill>
            <button
              className="icon-btn"
              onClick={() => void load()}
              aria-label="Refresh"
            >
              ↻
            </button>
          </div>
        </header>
        {error && (
          <div className="toast toast-error">
            <strong>Action blocked</strong>
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        {notice && (
          <div className="toast">
            <strong>Signal received</strong>
            <span>{notice}</span>
            <button onClick={() => setNotice(null)}>×</button>
          </div>
        )}
        {view === 'command' && (
          <CommandView
            snapshot={snapshot}
            selected={selected}
            overall={overall}
            completed={completed}
            onNavigate={(next, questId) => {
              if (questId) setSelectedId(questId);
              setView(next);
            }}
            onAct={act}
            busy={busy}
          />
        )}
        {view === 'campaign' && (
          <CampaignView
            snapshot={snapshot}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setView('quest');
            }}
          />
        )}
        {view === 'quest' && (
          <QuestCockpit
            quest={selected}
            busy={busy}
            onAct={act}
            onRefresh={load}
            onNotice={setNotice}
          />
        )}
        {view === 'mentor' && (
          <MentorView
            snapshot={snapshot}
            quest={selected}
            onNotice={setNotice}
          />
        )}
        {view === 'repository' && (
          <RepositoryView snapshot={snapshot} onAct={act} />
        )}
      </main>
    </div>
  );
}

function CommandView({
  snapshot,
  selected,
  overall,
  completed,
  onNavigate,
  onAct,
  busy,
}: {
  snapshot: CampaignSnapshot;
  selected: QuestView;
  overall: number;
  completed: number;
  onNavigate: (view: View, id?: string) => void;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
  busy: boolean;
}) {
  const active = snapshot.progress.currentQuest
    ? snapshot.quests.find(
        (quest) => quest.id === snapshot.progress.currentQuest,
      )!
    : selected;
  const checkpointDone = Object.values(active.progress.checkpoints).filter(
    Boolean,
  ).length;
  const nextMove = getNextLearningMove(active);
  return (
    <div className="content-grid">
      <section className="hero-card">
        <div className="hero-glow" />
        <div className="hero-copy">
          <span className="eyebrow">CURRENT OPERATION</span>
          <div className="quest-line">
            <Pill
              tone={active.progress.status === 'in_progress' ? 'cyan' : 'amber'}
            >
              {active.progress.status.replace('_', ' ')}
            </Pill>
            <span>
              WEEK {active.week} · {active.theme.toUpperCase()}
            </span>
          </div>
          <h2>
            {active.id} // {active.title}
          </h2>
          <p>{active.transmission.replace(/\*\*/g, '')}</p>
          <div className="learning-compass">
            <span>NEXT LEARNING MOVE</span>
            <strong>{nextMove.label}</strong>
            <p>{nextMove.detail}</p>
          </div>
          <div className="hero-actions">
            {active.progress.status === 'unlocked' ? (
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  void onAct({ action: 'start', questId: active.id })
                }
              >
                Initialize quest <span>→</span>
              </button>
            ) : (
              <button
                className="primary"
                onClick={() => onNavigate('quest', active.id)}
              >
                Enter quest cockpit <span>→</span>
              </button>
            )}
            <button
              className="secondary"
              onClick={() => onNavigate('mentor', active.id)}
            >
              Open mentor
            </button>
          </div>
        </div>
        <div className="radar">
          <div className="radar-ring">
            <div>
              <strong>{checkpointDone}</strong>
              <span>/{active.checkpoints.length}</span>
              <small>CHECKPOINTS</small>
            </div>
          </div>
        </div>
      </section>
      <section className="metrics">
        <article>
          <span>CAMPAIGN</span>
          <strong>
            {completed}
            <small> / 48</small>
          </strong>
          <ProgressBar value={overall} label="Overall completion" />
        </article>
        <article>
          <span>EXPERIENCE</span>
          <strong>
            {snapshot.progress.totalXp}
            <small> XP</small>
          </strong>
          <ProgressBar
            value={(snapshot.progress.totalXp % 500) / 5}
            label={`Level ${Math.floor(snapshot.progress.totalXp / 500) + 1} progress`}
          />
        </article>
        <article>
          <span>READINESS</span>
          <strong>
            {active.gate.ready
              ? 'READY'
              : `${active.gate.missing.length} GATES`}
          </strong>
          <ul className="mini-list">
            {active.gate.missing.slice(0, 2).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
      <section className="panel week-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">SECTOR STATUS</span>
            <h3>12-week campaign</h3>
          </div>
          <button className="text-btn" onClick={() => onNavigate('campaign')}>
            View full map →
          </button>
        </div>
        <div className="week-strip">
          {Array.from({ length: 12 }, (_, index) => {
            const week = index + 1;
            const quests = snapshot.quests.filter(
              (quest) => quest.week === week,
            );
            const done = quests.filter(
              (quest) => quest.progress.status === 'completed',
            ).length;
            const current = quests.some((quest) => quest.id === active.id);
            return (
              <button
                key={week}
                className={current ? 'current' : done === 4 ? 'done' : ''}
                onClick={() => onNavigate('campaign')}
              >
                <span>{String(week).padStart(2, '0')}</span>
                <b>{done}/4</b>
              </button>
            );
          })}
        </div>
      </section>
      <section className="panel activity-panel">
        <div className="panel-title">
          <div>
            <span className="eyebrow">SYSTEM LOG</span>
            <h3>Recent activity</h3>
          </div>
        </div>
        {snapshot.progress.activity.length ? (
          <div className="activity-list">
            {snapshot.progress.activity.slice(0, 6).map((event) => (
              <div key={event.id}>
                <span className="activity-dot" />
                <div>
                  <strong>{event.message}</strong>
                  <small>{new Date(event.createdAt).toLocaleString()}</small>
                </div>
                {event.questId && <Pill>{event.questId}</Pill>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Glyph>◇</Glyph>
            <p>No campaign events yet.</p>
            <span>Start your first quest to establish the activity feed.</span>
          </div>
        )}
      </section>
    </div>
  );
}

function CampaignView({
  snapshot,
  selectedId,
  onSelect,
}: {
  snapshot: CampaignSnapshot;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="campaign-grid">
      {Array.from({ length: 12 }, (_, index) => {
        const week = index + 1;
        const quests = snapshot.quests.filter((quest) => quest.week === week);
        const unlocked = quests.some(
          (quest) => quest.progress.status !== 'locked',
        );
        return (
          <section
            className={`week-card ${unlocked ? '' : 'locked'}`}
            key={week}
          >
            <div className="week-head">
              <span>WEEK {String(week).padStart(2, '0')}</span>
              <Pill
                tone={
                  quests.every((quest) => quest.progress.status === 'completed')
                    ? 'green'
                    : unlocked
                      ? 'cyan'
                      : 'neutral'
                }
              >
                {
                  quests.filter(
                    (quest) => quest.progress.status === 'completed',
                  ).length
                }
                /4
              </Pill>
            </div>
            <h2>{quests[0]?.theme}</h2>
            <div className="quest-stack">
              {quests.map((quest) => (
                <button
                  key={quest.id}
                  disabled={quest.progress.status === 'locked'}
                  className={`${quest.id === selectedId ? 'selected' : ''} status-${quest.progress.status}`}
                  onClick={() => onSelect(quest.id)}
                >
                  <span className="quest-node">
                    {quest.progress.status === 'completed'
                      ? '✓'
                      : quest.progress.status === 'locked'
                        ? '⌾'
                        : quest.type === 'boss'
                          ? '◆'
                          : quest.type === 'debug'
                            ? '!'
                            : '◇'}
                  </span>
                  <span>
                    <small>
                      {quest.id} · {quest.type}
                    </small>
                    <strong>{quest.title}</strong>
                  </span>
                  <b>{quest.xp} XP</b>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function QuestCockpit({
  quest,
  busy,
  onAct,
  onRefresh,
  onNotice,
}: {
  quest: QuestView;
  busy: boolean;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
  onRefresh: () => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const [tab, setTab] = useState<
    'brief' | 'checks' | 'evidence' | 'reflection'
  >('brief');
  const [run, setRun] = useState<CommandRun | null>(null);
  const [evidence, setEvidence] = useState({ summary: '', detail: '' });
  const [answers, setAnswers] = useState<Record<string, string>>(
    quest.progress.reflectionAnswers,
  );
  useEffect(() => {
    setAnswers(quest.progress.reflectionAnswers);
  }, [quest.id, quest.progress.reflectionAnswers]);
  useEffect(() => {
    if (!run || run.status !== 'running') return;
    const timer = setInterval(async () => {
      const next = await request<CommandRun>(`/api/runs/${run.id}`);
      setRun(next);
      if (next.status !== 'running') {
        clearInterval(timer);
        await onRefresh();
      }
    }, 900);
    return () => clearInterval(timer);
  }, [run, onRefresh]);
  const runCheck = async (command: string) => {
    const next = await request<CommandRun>('/api/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'run', questId: quest.id, command }),
    });
    setRun(next);
  };
  const revealed = quest.hints.slice(0, quest.progress.hintsRevealed);
  return (
    <div className="quest-layout">
      <section className="quest-header panel">
        <div>
          <div className="quest-line">
            <Pill
              tone={
                quest.type === 'boss'
                  ? 'magenta'
                  : quest.type === 'debug'
                    ? 'amber'
                    : 'cyan'
              }
            >
              {quest.type}
            </Pill>
            <span>
              WEEK {quest.week} · {quest.theme}
            </span>
          </div>
          <h2>
            {quest.id} // {quest.title}
          </h2>
          <p>{quest.transmission.replace(/\*\*/g, '')}</p>
        </div>
        <div className="quest-score">
          <strong>{quest.xp}</strong>
          <span>XP REWARD</span>
        </div>
      </section>
      <div className="tabs" role="tablist">
        {(['brief', 'checks', 'evidence', 'reflection'] as const).map(
          (item) => (
            <button
              key={item}
              className={tab === item ? 'active' : ''}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>
      {quest.progress.status === 'unlocked' && (
        <section className="panel start-panel">
          <h3>Quest ready to initialize</h3>
          <p>
            Starting records the campaign timestamp and locks focus to this
            challenge.
          </p>
          <button
            className="primary"
            disabled={busy}
            onClick={() => void onAct({ action: 'start', questId: quest.id })}
          >
            Start {quest.id}
          </button>
        </section>
      )}
      {tab === 'brief' && (
        <div className="quest-columns">
          <section className="panel prose">
            <span className="eyebrow">MISSION PARAMETERS</span>
            <h3>Objectives</h3>
            <ul>
              {quest.objectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Required behavior</h3>
            <ul>
              {quest.requiredBehavior.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Primer</h3>
            <p>{quest.primer}</p>
            <div className="button-row">
              <button
                className="secondary"
                onClick={() => void onAct({ action: 'open', path: quest.file })}
              >
                Open brief in editor
              </button>
            </div>
          </section>
          <aside className="panel checkpoints">
            <span className="eyebrow">CHECKPOINTS</span>
            <h3>Execution path</h3>
            {quest.checkpoints.map((item, index) => (
              <label
                key={item.id}
                className={quest.progress.checkpoints[item.id] ? 'checked' : ''}
              >
                <input
                  type="checkbox"
                  disabled={quest.progress.status !== 'in_progress'}
                  checked={Boolean(quest.progress.checkpoints[item.id])}
                  onChange={(event) =>
                    void onAct({
                      action: 'checkpoint',
                      questId: quest.id,
                      checkpointId: item.id,
                      completed: event.target.checked,
                    })
                  }
                />
                <span>{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </div>
              </label>
            ))}
            <div className="hint-zone">
              <div>
                <span className="eyebrow">HINT LADDER</span>
                <Pill>{quest.progress.hintsRevealed}/3</Pill>
              </div>
              {revealed.map((hint) => (
                <article key={hint.level}>
                  <strong>
                    LEVEL {hint.level} · {hint.title}
                  </strong>
                  <p>{hint.body}</p>
                </article>
              ))}
              {quest.progress.hintsRevealed < quest.hints.length && (
                <button
                  className="secondary full"
                  disabled={quest.progress.status !== 'in_progress'}
                  onClick={() =>
                    void onAct({ action: 'hint', questId: quest.id })
                  }
                >
                  Reveal hint {quest.progress.hintsRevealed + 1}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
      {tab === 'checks' && (
        <section className="panel checks">
          <div className="panel-title">
            <div>
              <span className="eyebrow">ALLOWLISTED EXECUTION</span>
              <h3>Automated gates</h3>
            </div>
            <Pill tone={quest.gate.automatedChecks ? 'green' : 'amber'}>
              {quest.gate.automatedChecks ? 'PASSING' : 'INCOMPLETE'}
            </Pill>
          </div>
          {quest.checks.map((command) => {
            const result = quest.progress.passedChecks.find(
              (item) => item.command === command,
            );
            return (
              <div className="check-row" key={command}>
                <span
                  className={`check-state ${result?.passed ? 'pass' : result ? 'fail' : ''}`}
                >
                  {result?.passed ? '✓' : result ? '×' : '·'}
                </span>
                <code>{command}</code>
                <span>
                  {result
                    ? new Date(result.checkedAt).toLocaleTimeString()
                    : 'Not run'}
                </span>
                <button
                  disabled={
                    run?.status === 'running' ||
                    quest.progress.status !== 'in_progress'
                  }
                  onClick={() => void runCheck(command)}
                >
                  Run check
                </button>
              </div>
            );
          })}
          {run && (
            <div className="terminal">
              <div className="terminal-head">
                <span>
                  <i className={run.status} />
                  {run.command}
                </span>
                <span>{run.status.toUpperCase()}</span>
                {run.status === 'running' && (
                  <button
                    onClick={() =>
                      void request(`/api/runs/${run.id}`, {
                        method: 'DELETE',
                      }).then(() => setRun({ ...run, status: 'cancelled' }))
                    }
                  >
                    Cancel
                  </button>
                )}
              </div>
              <pre>{run.output || 'Starting process…'}</pre>
            </div>
          )}
        </section>
      )}
      {tab === 'evidence' && (
        <div className="quest-columns">
          <section className="panel">
            <span className="eyebrow">MANUAL GATE</span>
            <h3>What to verify</h3>
            <p>{quest.manualGate}</p>
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                void onAct({
                  action: 'evidence',
                  questId: quest.id,
                  kind: 'manual',
                  ...evidence,
                }).then(() => setEvidence({ summary: '', detail: '' }));
              }}
            >
              <label>
                Evidence summary
                <input
                  required
                  minLength={3}
                  value={evidence.summary}
                  onChange={(event) =>
                    setEvidence({ ...evidence, summary: event.target.value })
                  }
                  placeholder="Observed API rejection for unauthorized request"
                />
              </label>
              <label>
                Details
                <textarea
                  value={evidence.detail}
                  onChange={(event) =>
                    setEvidence({ ...evidence, detail: event.target.value })
                  }
                  placeholder="Commands, response, screenshot path, or observation…"
                />
              </label>
              <button
                className="primary"
                disabled={quest.progress.status !== 'in_progress'}
              >
                Record evidence
              </button>
            </form>
          </section>
          <section className="panel">
            <span className="eyebrow">EVIDENCE LOCKER</span>
            <h3>{quest.progress.evidence.length} recorded signals</h3>
            {quest.progress.evidence.length ? (
              <div className="evidence-list">
                {quest.progress.evidence.map((item) => (
                  <article key={item.id}>
                    <Pill tone={item.kind === 'manual' ? 'cyan' : 'neutral'}>
                      {item.kind}
                    </Pill>
                    <strong>{item.summary}</strong>
                    <p>{item.detail}</p>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <Glyph>▱</Glyph>
                <p>No evidence recorded.</p>
              </div>
            )}
          </section>
        </div>
      )}
      {tab === 'reflection' && (
        <section className="panel reflection">
          <div className="panel-title">
            <div>
              <span className="eyebrow">EXPLAIN-IT-BACK GATE</span>
              <h3>Reflection and completion</h3>
            </div>
            <Pill tone={quest.gate.reflections ? 'green' : 'amber'}>
              {quest.gate.reflections ? 'COMPLETE' : 'DRAFT'}
            </Pill>
          </div>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              void onAct({
                action: 'reflection',
                questId: quest.id,
                answers,
              }).then(() =>
                onNotice('Reflection saved to the learning journal.'),
              );
            }}
          >
            {quest.reflections.map((item) => (
              <label key={item.id}>
                {item.prompt}
                <textarea
                  minLength={20}
                  required
                  value={answers[item.id] ?? ''}
                  onChange={(event) =>
                    setAnswers({ ...answers, [item.id]: event.target.value })
                  }
                />
              </label>
            ))}
            <button
              className="secondary"
              disabled={quest.progress.status !== 'in_progress'}
            >
              Save reflection journal
            </button>
          </form>
          <div className="completion">
            <h3>Completion protocol</h3>
            <div className="gate-grid">
              {Object.entries({
                'Automated checks': quest.gate.automatedChecks,
                Checkpoints: quest.gate.checkpoints,
                'Manual evidence': quest.gate.manualEvidence,
                Reflection: quest.gate.reflections,
              }).map(([label, passed]) => (
                <div key={label} className={passed ? 'passed' : ''}>
                  <span>{passed ? '✓' : '○'}</span>
                  {label}
                </div>
              ))}
            </div>
            <button
              className="primary full"
              disabled={
                !quest.gate.ready || quest.progress.status !== 'in_progress'
              }
              onClick={() => {
                if (
                  window.confirm(
                    `Complete ${quest.id} and unlock the next quest?`,
                  )
                )
                  void onAct({ action: 'complete', questId: quest.id });
              }}
            >
              Confirm completion · +{quest.xp} XP
            </button>
            {!quest.gate.ready && (
              <p className="gate-note">
                Still required: {quest.gate.missing.join(' · ')}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function MentorView({
  snapshot,
  quest,
  onNotice,
}: {
  snapshot: CampaignSnapshot;
  quest: QuestView;
  onNotice: (message: string) => void;
}) {
  const defaultFiles = [
    quest.file,
    'docs/ARCHITECTURE.md',
    'learning/progress.json',
  ];
  const [question, setQuestion] = useState(
    'I am blocked. Help me diagnose the next smallest experiment without giving me the complete solution.',
  );
  const [files, setFiles] = useState(defaultFiles);
  const [preview, setPreview] = useState<{
    payload: unknown;
    hash: string;
    characterCount: number;
  } | null>(null);
  const [answer, setAnswer] = useState<MentorResponse | null>(null);
  const [mentorError, setMentorError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setFiles([quest.file, 'docs/ARCHITECTURE.md', 'learning/progress.json']);
    setPreview(null);
    setAnswer(null);
    setMentorError('');
  }, [quest.id, quest.file]);
  const candidates = useMemo(
    () =>
      [
        quest.file,
        'docs/ARCHITECTURE.md',
        'docs/DOMAIN.md',
        'docs/SECURITY.md',
        'docs/TESTING.md',
        'learning/progress.json',
        quest.progress.journalPath,
      ].filter(Boolean) as string[],
    [quest],
  );
  const createPreview = async () => {
    setBusy(true);
    setMentorError('');
    try {
      setPreview(
        await request('/api/mentor/preview', {
          method: 'POST',
          body: JSON.stringify({ questId: quest.id, question, files }),
        }),
      );
    } catch (cause) {
      setMentorError(
        cause instanceof Error
          ? cause.message
          : 'Could not build context preview.',
      );
    } finally {
      setBusy(false);
    }
  };
  const handoff = `Help me as a hints-first mentor with Neon Syndicate quest ${quest.id}: ${quest.title}. Read AGENTS.md, docs/START_HERE.md, learning/progress.json, and ${quest.file}. My question: ${question}`;
  return (
    <div className="mentor-grid">
      <section className="panel mentor-compose">
        <div className="panel-title">
          <div>
            <span className="eyebrow">CONTEXT SELECTOR</span>
            <h3>Ask without surrendering the work</h3>
          </div>
          <Pill
            tone={
              snapshot.environment.antigravityAvailable ? 'green' : 'neutral'
            }
          >
            {snapshot.environment.antigravityAvailable
              ? 'PROXY ONLINE'
              : 'HANDOFF MODE'}
          </Pill>
        </div>
        <label>
          Your blocker
          <textarea
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
              setPreview(null);
            }}
          />
        </label>
        <fieldset>
          <legend>Files to include</legend>
          {candidates.map((file) => (
            <label key={file} className="file-check">
              <input
                type="checkbox"
                checked={files.includes(file)}
                onChange={(event) => {
                  setFiles(
                    event.target.checked
                      ? [...files, file]
                      : files.filter((item) => item !== file),
                  );
                  setPreview(null);
                }}
              />
              <code>{file}</code>
            </label>
          ))}
        </fieldset>
        <div className="privacy-note">
          <Glyph>◉</Glyph>
          <div>
            <strong>Preview-and-approve privacy</strong>
            <p>
              Likely secrets are redacted. Nothing is sent to the Antigravity
              proxy until you preview the exact payload and explicitly approve
              it.
            </p>
          </div>
        </div>
        {mentorError && <p className="error-box">{mentorError}</p>}
        <button
          className="primary"
          disabled={busy || !question.trim()}
          onClick={() => void createPreview()}
        >
          Build context preview
        </button>
        <button
          className="secondary"
          onClick={() =>
            void navigator.clipboard
              .writeText(handoff)
              .then(() =>
                onNotice(
                  'Agent handoff copied. Paste it into any coding agent.',
                ),
              )
          }
        >
          Copy agent handoff
        </button>
      </section>
      <section className="panel context-preview">
        <span className="eyebrow">OUTBOUND PAYLOAD</span>
        <h3>
          {preview
            ? `${preview.characterCount.toLocaleString()} characters`
            : 'Awaiting preview'}
        </h3>
        {preview ? (
          <>
            <pre>{JSON.stringify(preview.payload, null, 2)}</pre>
            <button
              className="primary full"
              disabled={!snapshot.environment.antigravityAvailable || busy}
              onClick={async () => {
                setBusy(true);
                setMentorError('');
                try {
                  const result = await request<{ answer: MentorResponse }>(
                    '/api/mentor/send',
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        questId: quest.id,
                        question,
                        files,
                        approvedHash: preview.hash,
                      }),
                    },
                  );
                  setAnswer(result.answer);
                } catch (cause) {
                  setMentorError(
                    cause instanceof Error
                      ? cause.message
                      : 'Mentor request failed.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {snapshot.environment.antigravityAvailable
                ? `Approve and ask Antigravity · ${snapshot.environment.mentorModel}`
                : 'Start Antigravity proxy to send'}
            </button>
          </>
        ) : (
          <div className="empty tall">
            <Glyph>⌁</Glyph>
            <p>Select context and build a preview.</p>
            <span>
              The engine will show every character before transmission.
            </span>
          </div>
        )}
      </section>
      {answer && (
        <section className="panel mentor-answer">
          <span className="eyebrow">MENTOR RESPONSE</span>
          <h3>{answer.concept}</h3>
          <div className="mentor-sequence">
            <article>
              <span>01 · DIAGNOSIS</span>
              <p>{answer.diagnosis}</p>
            </article>
            <article>
              <span>02 · PREDICT</span>
              <p>{answer.question}</p>
            </article>
            <article>
              <span>03 · EXPERIMENT</span>
              <p>{answer.experiment}</p>
            </article>
            <article>
              <span>04 · SUCCESS SIGNAL</span>
              <p>{answer.successSignal}</p>
            </article>
          </div>
        </section>
      )}
    </div>
  );
}

function RepositoryView({
  snapshot,
  onAct,
}: {
  snapshot: CampaignSnapshot;
  onAct: (payload: Record<string, unknown>) => Promise<void>;
}) {
  return (
    <div className="repo-grid">
      <section className="panel repo-summary">
        <span className="eyebrow">WORKTREE</span>
        <h2>{snapshot.repository.branch}</h2>
        <div className="repo-metrics">
          <div>
            <strong>{snapshot.repository.changedCount}</strong>
            <span>Changed</span>
          </div>
          <div>
            <strong>{snapshot.repository.stagedCount}</strong>
            <span>Staged</span>
          </div>
          <div>
            <strong>{snapshot.repository.untrackedCount}</strong>
            <span>Untracked</span>
          </div>
        </div>
        <div className="environment">
          <h3>Environment</h3>
          <p>
            <span
              className={snapshot.environment.dockerAvailable ? 'ok' : ''}
            />
            <strong>Docker</strong>
            <small>
              {snapshot.environment.dockerAvailable
                ? 'available'
                : 'not installed'}
            </small>
          </p>
          <p>
            <span
              className={snapshot.environment.editorAvailable ? 'ok' : ''}
            />
            <strong>VS Code CLI</strong>
            <small>
              {snapshot.environment.editorAvailable
                ? 'available'
                : 'not detected'}
            </small>
          </p>
          <p>
            <span
              className={snapshot.environment.antigravityAvailable ? 'ok' : ''}
            />
            <strong>Antigravity mentor proxy</strong>
            <small>
              {snapshot.environment.antigravityAvailable
                ? snapshot.environment.mentorModel
                : 'optional / offline'}
            </small>
          </p>
        </div>
      </section>
      <section className="panel file-radar">
        <div className="panel-title">
          <div>
            <span className="eyebrow">GIT PORCELAIN</span>
            <h3>Workspace signals</h3>
          </div>
        </div>
        {snapshot.repository.status.length ? (
          <div className="status-list">
            {snapshot.repository.status.slice(0, 80).map((line) => (
              <button
                key={line}
                onClick={() =>
                  void onAct({ action: 'open', path: line.slice(3) })
                }
              >
                <code>{line.slice(0, 2)}</code>
                <span>{line.slice(3)}</span>
                <b>↗</b>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty tall">
            <Glyph>✓</Glyph>
            <p>Worktree is clean.</p>
          </div>
        )}
      </section>
      <section className="panel commits">
        <span className="eyebrow">RECENT COMMITS</span>
        <h3>History</h3>
        {snapshot.repository.recentCommits.length ? (
          snapshot.repository.recentCommits.map((commit) => (
            <div key={commit.hash}>
              <code>{commit.hash}</code>
              <span>{commit.subject}</span>
            </div>
          ))
        ) : (
          <div className="empty">
            <p>No commits yet.</p>
            <span>Your first focused commit becomes the campaign origin.</span>
          </div>
        )}
      </section>
    </div>
  );
}
