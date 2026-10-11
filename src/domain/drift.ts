/**
 * Section 6 semantic-drift simulator. A seeded, synthetic population of
 * workspaces (not Superchat data) is run through a background workflow
 * migration that fires `workflow_edited` for most workspaces over 21 days.
 *
 * Two decision paths are computed side by side:
 *  - the intended execution-based signal (successful runs only), and
 *  - a vulnerable stopgap edit-recency proxy (any workflow_edited counts).
 * Only the proxy can be contaminated. Workspaces without execution telemetry
 * stay UNKNOWN on the execution path, never "healthy".
 */
import { RULES } from './risk';

export interface SimParams {
  seed: number;
  population: number;
  migrations: boolean;
  /** Fraction of workspaces that get migrated during the rollout. */
  migratedShare: number;
  rolloutDays: number;
  startDay: number;
  endDay: number;
}

export const DEFAULT_PARAMS: SimParams = { seed: 7, population: 400, migrations: true, migratedShare: 0.85, rolloutDays: 21, startDay: -42, endDay: 34 };

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimWorkspace {
  id: string;
  telemetry: boolean;
  /** Day the workspace genuinely stopped using depth features (null = still engaged). */
  stallDay: number | null;
  migrationDay: number | null;
  userEditDays: Set<number>;
  systemEditDays: Map<number, number>;
  runDays: Set<number>;
}

export type ExecState = 'OK' | 'WATCH' | 'RECOVERED' | 'UNKNOWN';
export type ProxyState = 'OK' | 'WATCH' | 'RECOVERED';

export interface DayMetric {
  day: number;
  weekday: number;
  activeWorkspaces: number;
  editedWorkspaces: number;
  editEvents: number;
  editRate: number;
  editEventsPerActive: number;
  rollingBaseline: number | null;
  frozenBaseline: number;
  execCoverage: number;
  frozenExecCoverage: number;
  spikeAlert: boolean;
  driftAlert: boolean;
  /** WATCH → RECOVERED transitions on the naive proxy that day. */
  proxyRecoveries: number;
  /** ...of which have no supporting successful execution (or no telemetry). */
  unsupportedRecoveries: number;
  /** Proxy recoveries that only happened because of a system (migration) edit. */
  systemCausedRecoveries: number;
  /** Truly stalled workspaces the naive proxy is NOT flagging (suppressed review). */
  suppressedReviews: number;
  execWatch: number;
  execUnknown: number;
}

export interface SimResult {
  params: SimParams;
  workspaces: SimWorkspace[];
  days: DayMetric[];
  exec: Map<string, ExecState[]>;
  proxy: Map<string, ProxyState[]>;
  corrected: Map<string, ProxyState[]>;
  frozenBaseline: number;
  firstSpikeDay: number | null;
  firstDriftDay: number | null;
}

export function buildPopulation(p: SimParams): SimWorkspace[] {
  const r = mulberry32(p.seed);
  const out: SimWorkspace[] = [];
  for (let i = 0; i < p.population; i++) {
    const telemetry = r() < 0.8;
    const engagedThroughout = r() < 0.6;
    // ~10% of workspaces stall during the incident window: the ones the proxy would hide.
    const stallDay = engagedThroughout ? null : r() < 0.3 ? Math.floor(-6 + r() * 16) : Math.floor(p.startDay - 30 + r() * 25);
    const userEditDays = new Set<number>();
    const runDays = new Set<number>();
    for (let d = p.startDay - 30; d <= p.endDay; d++) {
      const engaged = stallDay == null || d < stallDay;
      if (r() < (engaged ? 0.08 : 0.004)) userEditDays.add(d);
      if (engaged && r() < 0.9) runDays.add(d);
    }
    // Always draw these, so turning migrations off doesn't shift the random sequence.
    const migRoll = r();
    const migDay = Math.floor(r() * p.rolloutDays);
    const migCount = 1 + Math.floor(r() * 3);
    const migrationDay = p.migrations && migRoll < p.migratedShare ? migDay : null;
    const systemEditDays = new Map<number, number>();
    if (migrationDay != null) systemEditDays.set(migrationDay, migCount);
    out.push({ id: `SIM-${String(i + 1).padStart(3, '0')}`, telemetry, stallDay, migrationDay, userEditDays, systemEditDays, runDays });
  }
  return out;
}

function lastBefore(days: Iterable<number>, d: number): number | null {
  let best: number | null = null;
  for (const x of days) if (x <= d && (best == null || x > best)) best = x;
  return best;
}

export function simulate(p: SimParams = DEFAULT_PARAMS): SimResult {
  const ws = buildPopulation(p);
  const dayList: number[] = [];
  for (let d = p.startDay; d <= p.endDay; d++) dayList.push(d);

  const exec = new Map<string, ExecState[]>();
  const proxy = new Map<string, ProxyState[]>();
  const corrected = new Map<string, ProxyState[]>();

  ws.forEach((w) => {
    const e: ExecState[] = [];
    const px: ProxyState[] = [];
    const cx: ProxyState[] = [];
    const allEdits = [...w.userEditDays, ...w.systemEditDays.keys()];
    dayList.forEach((d, i) => {
      if (!w.telemetry) e.push('UNKNOWN');
      else {
        const lr = lastBefore(w.runDays, d);
        const stalled = lr == null || d - lr >= RULES.stallDays;
        const prev = e[i - 1];
        e.push(stalled ? 'WATCH' : prev === 'WATCH' ? 'RECOVERED' : 'OK');
      }
      const step = (edits: number[], prev?: ProxyState): ProxyState => {
        const le = lastBefore(edits, d);
        const stale = le == null || d - le >= RULES.stallDays;
        return stale ? 'WATCH' : prev === 'WATCH' ? 'RECOVERED' : 'OK';
      };
      px.push(step(allEdits, px[i - 1]));
      cx.push(step([...w.userEditDays], cx[i - 1]));
    });
    exec.set(w.id, e);
    proxy.set(w.id, px);
    corrected.set(w.id, cx);
  });

  const rates: number[] = [];
  const execCov: number[] = [];
  const telemetryCount = ws.filter((w) => w.telemetry).length;
  dayList.forEach((d) => {
    const edited = ws.filter((w) => w.userEditDays.has(d) || w.systemEditDays.has(d)).length;
    rates.push(edited / p.population);
    execCov.push(ws.filter((w) => w.telemetry && w.runDays.has(d)).length / telemetryCount);
  });

  // Last-known-good baseline: the 28 days before the release, frozen and versioned.
  const preIdx = dayList.map((d, i) => [d, i] as const).filter(([d]) => d >= -28 && d < 0).map(([, i]) => i);
  const frozen = preIdx.reduce((s, i) => s + rates[i], 0) / preIdx.length;
  const frozenExec = preIdx.reduce((s, i) => s + execCov[i], 0) / preIdx.length;

  const days: DayMetric[] = dayList.map((d, i) => {
    const same = [7, 14, 21, 28].map((k) => rates[i - k]).filter((x) => x !== undefined);
    const rolling = same.length === 4 ? same.reduce((a, b) => a + b, 0) / 4 : null;
    const three = i >= 2 ? (rates[i] + rates[i - 1] + rates[i - 2]) / 3 : rates[i];
    const execLift = execCov[i] - frozenExec;
    let proxyRecoveries = 0;
    let unsupported = 0;
    let systemCaused = 0;
    let suppressed = 0;
    let execWatch = 0;
    let execUnknown = 0;
    ws.forEach((w) => {
      const px = proxy.get(w.id)![i];
      const ex = exec.get(w.id)![i];
      const cx = corrected.get(w.id)![i];
      if (px === 'RECOVERED') {
        proxyRecoveries++;
        if (ex !== 'OK' && ex !== 'RECOVERED') unsupported++;
        if (cx !== 'RECOVERED') systemCaused++;
      }
      if (cx === 'WATCH' && px !== 'WATCH') suppressed++;
      if (ex === 'WATCH') execWatch++;
      if (ex === 'UNKNOWN') execUnknown++;
    });
    const editEvents = ws.reduce((s, w) => s + (w.userEditDays.has(d) ? 1 : 0) + (w.systemEditDays.get(d) ?? 0), 0);
    return {
      day: d,
      weekday: ((d % 7) + 7) % 7,
      activeWorkspaces: p.population,
      editedWorkspaces: Math.round(rates[i] * p.population),
      editEvents,
      editRate: rates[i],
      editEventsPerActive: editEvents / p.population,
      rollingBaseline: rolling,
      frozenBaseline: frozen,
      execCoverage: execCov[i],
      frozenExecCoverage: frozenExec,
      spikeAlert: p.population >= 50 && rates[i] / frozen >= 2 && execLift <= 0.01,
      driftAlert: p.population >= 50 && i >= 2 && three / frozen >= 1.5 && execLift <= 0.01,
      proxyRecoveries,
      unsupportedRecoveries: unsupported,
      systemCausedRecoveries: systemCaused,
      suppressedReviews: suppressed,
      execWatch,
      execUnknown,
    };
  });

  return {
    params: p,
    workspaces: ws,
    days,
    exec,
    proxy,
    corrected,
    frozenBaseline: frozen,
    firstSpikeDay: days.find((x) => x.spikeAlert)?.day ?? null,
    firstDriftDay: days.find((x) => x.driftAlert)?.day ?? null,
  };
}

/** Detection day: the integrity monitor's first alert, or day 21 ("three weeks pass before anyone notices"). */
export function detectionDay(sim: SimResult, monitorEnabled: boolean): number {
  if (!monitorEnabled) return 21;
  const days = [sim.firstSpikeDay, sim.firstDriftDay].filter((x): x is number => x != null);
  return days.length ? Math.min(...days) : 21;
}

export type RepairCategory = 'missed_help' | 'wrongly_recovered' | 'no_impact';

export interface ImpactRow {
  workspaceId: string;
  firstDivergenceDay: number;
  naive: ProxyState;
  corrected: ProxyState;
  exec: ExecState;
  category: RepairCategory;
}

/** Workspaces whose edit-proxy decision differs from the corrected one at any day up to `throughDay`. */
export function impactAnalysis(sim: SimResult, throughDay: number): ImpactRow[] {
  const idx = sim.days.findIndex((d) => d.day === throughDay);
  const rows: ImpactRow[] = [];
  sim.workspaces.forEach((w) => {
    const px = sim.proxy.get(w.id)!;
    const cx = sim.corrected.get(w.id)!;
    const ex = sim.exec.get(w.id)!;
    let first = -1;
    for (let i = 0; i <= idx; i++) if (px[i] !== cx[i]) {
      first = i;
      break;
    }
    if (first < 0) return;
    const naive = px[idx];
    const corr = cx[idx];
    const category: RepairCategory = corr === 'WATCH' && naive !== 'WATCH' ? 'missed_help' : naive === 'RECOVERED' ? 'wrongly_recovered' : 'no_impact';
    rows.push({ workspaceId: w.id, firstDivergenceDay: sim.days[first].day, naive, corrected: corr, exec: ex[idx], category });
  });
  return rows;
}

/** True if the execution-based states are identical with and without the migration. */
export function execUnaffected(a: SimResult, b: SimResult): boolean {
  for (const [id, states] of a.exec) {
    const other = b.exec.get(id);
    if (!other || other.length !== states.length || other.some((s, i) => s !== states[i])) return false;
  }
  return true;
}
