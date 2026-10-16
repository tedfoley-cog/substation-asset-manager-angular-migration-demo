// Framework-neutral comparison engine for the Settings Comparison screen (DES-SETCMP-007, ADR-004).
// No Angular imports, no DOM, no locale formatting: callers format numbers/dates for display (DES-SETCMP-008).
// Parsing happens only here, at comparison time; wire values stay raw strings everywhere else (CS-02, CS-13).

/** Tolerance used when deciding whether a numeric setting "really" changed (relays round on export). */
export const EPSILON = 0.0005;

export type Kind = 'changed' | 'added' | 'removed' | 'unchanged';
export type Severity = 0 | 1 | 2 | 3;

export interface SettingValue {
  settingGroup: string;
  lnClass: string;
  name: string;
  value: string | null;
  unit: string | null;
  minValue: string | null;
  maxValue: string | null;
}

export interface SettingsFile {
  id: number;
  iedId: number;
  iedName: string;
  versionNo: number;
  values: SettingValue[];
  status?: string;
  filename?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  comment?: string | null;
}

export interface HistoryEntry {
  id: number;
  iedId: number;
  versionNo: number;
  status: string;
  uploadedAt: string;
  uploadedBy: string;
  filename?: string;
  comment?: string | null;
}

export interface CompareRow {
  key: string;
  settingGroup: string;
  lnClass: string;
  name: string;
  unit: string | null;
  minValue: string | null;
  maxValue: string | null;
  left?: SettingValue;
  right?: SettingValue;
  kind: Kind;
  violation: string | null;
  deltaPercent: number | null;
  severity: Severity;
}

export interface Summary {
  changed: number;
  added: number;
  removed: number;
  violations: number;
  unchanged: number;
}

export interface CompareResult {
  rows: CompareRow[];
  summary: Summary;
  groups: string[];
}

export interface Selection {
  left: number | null;
  right: number | null;
}

type IdLike = string | number | null | undefined;

const DE_GROUPED = /^-?\d{1,3}(\.\d{3})*(,\d+)?$/;
const PROTECTION_LN = /PDIF|PTOC|PIOC|PDIS|PTRC|RBRF/;
const PROTECTION_SETTING = /Pickup|Setting|Reach|Slope|Time Delay|Zone/i;

/** NaN for null / '' / non-numeric. de* locales accept `1.234,5`; every locale accepts a decimal comma. */
export function toNumber(raw: string | number | null | undefined, locale: string): number {
  if (raw === null || raw === undefined || raw === '') {
    return NaN;
  }
  let s = String(raw).trim();
  if (locale.indexOf('de') === 0 && DE_GROUPED.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(',', '.');
  }
  return Number(s);
}

export function classify(left: SettingValue | undefined, right: SettingValue | undefined, locale: string): Kind {
  if (left === undefined) {
    return 'added';
  }
  if (right === undefined) {
    return 'removed';
  }
  const l = toNumber(left.value, locale);
  const r = toNumber(right.value, locale);
  if (!isNaN(l) && !isNaN(r)) {
    return Math.abs(l - r) < EPSILON ? 'unchanged' : 'changed';
  }
  return String(left.value) === String(right.value) ? 'unchanged' : 'changed';
}

/** Candidate (right) side only; missing or non-numeric bounds never produce a violation. */
export function rangeViolation(v: SettingValue | undefined | null, locale: string): string | null {
  if (!v) {
    return null;
  }
  const n = toNumber(v.value, locale);
  if (isNaN(n)) {
    return null;
  }
  if (v.minValue !== null && v.minValue !== undefined && n < Number(v.minValue)) {
    return 'below minimum ' + v.minValue;
  }
  if (v.maxValue !== null && v.maxValue !== undefined && n > Number(v.maxValue)) {
    return 'exceeds maximum ' + v.maxValue;
  }
  return null;
}

/** Signed percentage change; null when either side is non-numeric or the baseline is 0. */
export function deltaPercent(left: SettingValue | undefined, right: SettingValue | undefined, locale: string): number | null {
  const l = toNumber(left ? left.value : null, locale);
  const r = toNumber(right ? right.value : null, locale);
  if (isNaN(l) || isNaN(r) || l === 0) {
    return null;
  }
  return ((r - l) / Math.abs(l)) * 100;
}

export function severity(row: Pick<CompareRow, 'kind' | 'violation' | 'lnClass' | 'name'>): Severity {
  if (row.violation) {
    return 3;
  }
  if (row.kind === 'removed' && PROTECTION_LN.test(row.lnClass)) {
    return 2;
  }
  if (row.kind === 'changed' && PROTECTION_SETTING.test(row.name)) {
    return 2;
  }
  if (row.kind === 'unchanged') {
    return 0;
  }
  return 1;
}

function pairKey(v: SettingValue): string {
  return v.settingGroup + '|' + v.name;
}

export function compare(leftFile: SettingsFile | null, rightFile: SettingsFile | null, locale: string): CompareResult {
  const byKey: { [key: string]: { left?: SettingValue; right?: SettingValue } } = {};
  (leftFile ? leftFile.values : []).forEach(v => {
    byKey[pairKey(v)] = { left: v };
  });
  (rightFile ? rightFile.values : []).forEach(v => {
    const pair = byKey[pairKey(v)] || (byKey[pairKey(v)] = {});
    pair.right = v;
  });

  const rows: CompareRow[] = Object.keys(byKey).map(key => {
    const pair = byKey[key];
    const ref = (pair.right || pair.left) as SettingValue;
    const kind = classify(pair.left, pair.right, locale);
    const violation = rangeViolation(pair.right, locale);
    const partial = { kind, violation, lnClass: ref.lnClass, name: ref.name };
    return {
      key,
      settingGroup: ref.settingGroup,
      lnClass: ref.lnClass,
      name: ref.name,
      unit: ref.unit,
      minValue: ref.minValue,
      maxValue: ref.maxValue,
      left: pair.left,
      right: pair.right,
      kind,
      violation,
      deltaPercent: deltaPercent(pair.left, pair.right, locale),
      severity: severity(partial)
    };
  });

  rows.sort((a, b) => b.severity - a.severity || a.settingGroup.localeCompare(b.settingGroup) || a.name.localeCompare(b.name));

  const summary: Summary = { changed: 0, added: 0, removed: 0, violations: 0, unchanged: 0 };
  rows.forEach(r => {
    summary[r.kind]++;
    if (r.violation) {
      summary.violations++;
    }
  });

  const seen: { [group: string]: boolean } = {};
  const groups = rows.map(r => r.settingGroup).filter(g => (seen[g] ? false : (seen[g] = true))).sort();

  return { rows, summary, groups };
}

export function visibleRows(rows: CompareRow[], showUnchanged: boolean, group: string | null | undefined): CompareRow[] {
  return rows.filter(r => (showUnchanged || r.kind !== 'unchanged') && (!group || r.settingGroup === group));
}

function toId(id: IdLike): number | null {
  return id === null || id === undefined || id === '' ? null : Number(id);
}

/** Right defaults to the ACTIVE version (else the newest); left to the first entry with a lower versionNo. Explicit ids win. */
export function defaultSelection(history: HistoryEntry[], left?: IdLike, right?: IdLike): Selection {
  let rightId = toId(right);
  if (rightId === null) {
    const active = history.filter(h => h.status === 'ACTIVE')[0] || history[0];
    rightId = active ? active.id : null;
  }
  let leftId = toId(left);
  if (leftId === null) {
    const rightEntry = history.filter(h => h.id === rightId)[0];
    const rightVersion = rightEntry ? rightEntry.versionNo : undefined;
    const prev = history.filter(h => h.id !== rightId && rightVersion !== undefined && h.versionNo < rightVersion)[0];
    leftId = prev ? prev.id : null;
  }
  return { left: leftId, right: rightId };
}

function csvCell(c: string | null | undefined): string {
  return '"' + String(c === null || c === undefined ? '' : c).replace(/"/g, '""') + '"';
}

/** CSV for the rows given (callers pass the visible rows). Raw wire values, every cell quoted, inner quotes doubled. */
export function csvText(left: SettingsFile | null, right: SettingsFile | null, rows: CompareRow[]): string {
  const header = 'group,ln,setting,unit,' + (left ? 'v' + left.versionNo : '-') + ',' + (right ? 'v' + right.versionNo : '-') + ',kind,violation';
  const lines = rows.map(r =>
    [r.settingGroup, r.lnClass, r.name, r.unit || '', r.left ? r.left.value : '', r.right ? r.right.value : '', r.kind, r.violation || '']
      .map(csvCell)
      .join(',')
  );
  return [header].concat(lines).join('\n');
}
