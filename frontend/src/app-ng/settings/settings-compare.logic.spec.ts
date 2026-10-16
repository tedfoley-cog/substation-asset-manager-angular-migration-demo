import {
  EPSILON, CompareRow, SettingValue, classify, compare, csvText, defaultSelection, deltaPercent, rangeViolation, severity, toNumber, visibleRows
} from './settings-compare.logic';
import { KARMA_HISTORY, KARMA_V2, KARMA_V3, SEED_V2, SEED_V3 } from './fixtures/nth01-t1-87t.fixture';

const DE = 'de-DE';
const EN = 'en-GB';

function sv(partial: Partial<SettingValue> & { name: string; value: string | null }): SettingValue {
  return { settingGroup: 'Group 1', lnClass: 'PDIF', unit: null, minValue: null, maxValue: null, ...partial };
}

describe('settings-compare.logic (framework-neutral engine, DES-SETCMP-007)', () => {
  it('exports the tolerance used by the legacy controller', () => {
    expect(EPSILON).toBe(0.0005);
  });

  describe('TST-SETCMP-001 classify tolerates export rounding', () => {
    it('treats differences below EPSILON as unchanged and differences of EPSILON or more as changed', () => {
      expect(classify(sv({ name: 'a', value: '0.30' }), sv({ name: 'a', value: '0.3000' }), EN)).toBe('unchanged');
      // |0.3004 - 0.3000| = 0.0004 < EPSILON: still unchanged (legacy `< EPSILON`); 0.3005 and 0.301 are changed.
      expect(classify(sv({ name: 'a', value: '0.3004' }), sv({ name: 'a', value: '0.3000' }), EN)).toBe('unchanged');
      expect(classify(sv({ name: 'a', value: '0.3005' }), sv({ name: 'a', value: '0.3000' }), EN)).toBe('changed');
      expect(classify(sv({ name: 'a', value: '0.301' }), sv({ name: 'a', value: '0.3000' }), EN)).toBe('changed');
      expect(classify(sv({ name: 'a', value: '0,30' }), sv({ name: 'a', value: '0.3000' }), DE)).toBe('unchanged');
    });
    it('compares non-numeric values as exact strings', () => {
      expect(classify(sv({ name: 'a', value: '3-pole' }), sv({ name: 'a', value: '3-pole' }), EN)).toBe('unchanged');
      expect(classify(sv({ name: 'a', value: '3-pole' }), sv({ name: 'a', value: '1-pole' }), EN)).toBe('changed');
      expect(classify(sv({ name: 'a', value: 'IEC-VI' }), sv({ name: 'a', value: 'iec-vi' }), EN)).toBe('changed');
    });
  });

  describe('TST-SETCMP-002 toNumber', () => {
    it('parses de grouped values, en decimal commas and rejects blanks', () => {
      expect(toNumber('1.234,5', DE)).toBe(1234.5);
      expect(toNumber('0,30', DE)).toBe(0.3);
      expect(toNumber('1,5', EN)).toBe(1.5);
      expect(toNumber('1234.5', EN)).toBe(1234.5);
      expect(toNumber(' 25 ', EN)).toBe(25);
      expect(toNumber(7, EN)).toBe(7);
    });
    it('returns NaN (never 0) for null, undefined, empty and non-numeric input', () => {
      expect(toNumber(null, EN)).toBeNaN();
      expect(toNumber(undefined, DE)).toBeNaN();
      expect(toNumber('', EN)).toBeNaN();
      expect(toNumber('3-pole', DE)).toBeNaN();
      expect(toNumber('600:1', EN)).toBeNaN();
    });
  });

  describe('TST-SETCMP-003 pairing by settingGroup|name', () => {
    it('yields added / removed / changed / unchanged kinds and keeps group-qualified keys apart', () => {
      const left = { ...KARMA_V2, values: [sv({ name: 'x', value: '1' }), sv({ name: 'y', value: '2' }), sv({ name: 'z', value: 'a' })] };
      const right = { ...KARMA_V3, values: [sv({ name: 'y', value: '3' }), sv({ name: 'z', value: 'a' }), sv({ name: 'x', value: '1', settingGroup: 'Group 2' })] };
      const rows = compare(left, right, EN).rows;
      const byKey: { [k: string]: CompareRow } = {};
      rows.forEach(r => (byKey[r.key] = r));
      expect(Object.keys(byKey).sort()).toEqual(['Group 1|x', 'Group 1|y', 'Group 1|z', 'Group 2|x']);
      expect(byKey['Group 1|x'].kind).toBe('removed');
      expect(byKey['Group 2|x'].kind).toBe('added');
      expect(byKey['Group 1|y'].kind).toBe('changed');
      expect(byKey['Group 1|z'].kind).toBe('unchanged');
      expect(byKey['Group 1|y'].left?.value).toBe('2');
      expect(byKey['Group 1|y'].right?.value).toBe('3');
    });
    it('handles a missing side as all added / all removed', () => {
      expect(compare(null, KARMA_V3, EN).rows.every(r => r.kind === 'added')).toBeTrue();
      expect(compare(KARMA_V2, null, EN).rows.every(r => r.kind === 'removed')).toBeTrue();
      expect(compare(null, null, EN)).toEqual({ rows: [], summary: { changed: 0, added: 0, removed: 0, violations: 0, unchanged: 0 }, groups: [] });
    });
  });

  describe('TST-SETCMP-004 rangeViolation (candidate side only)', () => {
    it('reports exceeded maximum and undercut minimum with the raw bound text', () => {
      expect(rangeViolation(sv({ name: 's', value: '55', minValue: '15', maxValue: '50' }), EN)).toBe('exceeds maximum 50');
      expect(rangeViolation(sv({ name: 's', value: '0.05', minValue: '0.10', maxValue: '1.00' }), EN)).toBe('below minimum 0.10');
      expect(rangeViolation(sv({ name: 's', value: '0,05', minValue: '0.10', maxValue: '1.00' }), DE)).toBe('below minimum 0.10');
      expect(rangeViolation(sv({ name: 's', value: '50', minValue: '15', maxValue: '50' }), EN)).toBeNull();
    });
    it('returns null for null bounds, non-numeric values and a missing candidate', () => {
      expect(rangeViolation(sv({ name: 's', value: '55' }), EN)).toBeNull();
      expect(rangeViolation(sv({ name: 's', value: '3-pole', minValue: '0', maxValue: '1' }), EN)).toBeNull();
      expect(rangeViolation(undefined, EN)).toBeNull();
      expect(rangeViolation(null, EN)).toBeNull();
    });
    it('never checks the baseline side', () => {
      const left = sv({ name: 's', value: '99', minValue: '15', maxValue: '50' });
      const right = sv({ name: 's', value: '20', minValue: '15', maxValue: '50' });
      const row = compare({ ...KARMA_V2, values: [left] }, { ...KARMA_V3, values: [right] }, EN).rows[0];
      expect(row.violation).toBeNull();
      expect(compare({ ...KARMA_V2, values: [left] }, { ...KARMA_V3, values: [] }, EN).rows[0].violation).toBeNull();
    });
  });

  describe('TST-SETCMP-005 severity and ordering', () => {
    it('ranks violation 3, protection removals / protection-setting changes 2, other changes 1, unchanged 0', () => {
      expect(severity({ kind: 'changed', violation: 'exceeds maximum 50', lnClass: 'PDIF', name: 'x' })).toBe(3);
      expect(severity({ kind: 'removed', violation: null, lnClass: 'PDIF', name: 'anything' })).toBe(2);
      expect(severity({ kind: 'removed', violation: null, lnClass: 'TCTR', name: 'anything' })).toBe(1);
      expect(severity({ kind: 'changed', violation: null, lnClass: 'TCTR', name: '87T Pickup' })).toBe(2);
      expect(severity({ kind: 'changed', violation: null, lnClass: 'TCTR', name: 'Zone 2 reach' })).toBe(2);
      expect(severity({ kind: 'changed', violation: null, lnClass: 'TCTR', name: 'HV CT Ratio' })).toBe(1);
      expect(severity({ kind: 'added', violation: null, lnClass: 'PDIF', name: 'Pickup' })).toBe(1);
      expect(severity({ kind: 'unchanged', violation: null, lnClass: 'PDIF', name: 'Pickup' })).toBe(0);
    });
    it('sorts by severity desc, then group, then name', () => {
      const left = { ...KARMA_V2, values: [
        sv({ name: 'b', value: '1', settingGroup: 'Group 2' }), sv({ name: 'a', value: '1', settingGroup: 'Group 2' }),
        sv({ name: 'c', value: '1' }), sv({ name: 'Pickup', value: '1' })
      ] };
      const right = { ...KARMA_V3, values: [
        sv({ name: 'b', value: '2', settingGroup: 'Group 2' }), sv({ name: 'a', value: '2', settingGroup: 'Group 2' }),
        sv({ name: 'c', value: '1' }), sv({ name: 'Pickup', value: '2' })
      ] };
      expect(compare(left, right, EN).rows.map(r => r.settingGroup + ' ' + r.name)).toEqual(['Group 1 Pickup', 'Group 2 a', 'Group 2 b', 'Group 1 c']);
    });
  });

  describe('TST-SETCMP-006 Karma fixture NTH01_T1_87T v2→v3 (DES-SETCMP-025 i)', () => {
    const result = compare(KARMA_V2, KARMA_V3, DE);
    const byName: { [n: string]: CompareRow } = {};
    result.rows.forEach(r => (byName[r.name] = r));

    it('classifies every row like the legacy controller', () => {
      expect(byName['87T Pickup'].kind).toBe('unchanged');
      expect(byName['87T Slope 1'].kind).toBe('changed');
      expect(byName['87T Slope 1'].violation).toBe('exceeds maximum 50');
      expect(byName['5th Harmonic Block'].kind).toBe('removed');
      expect(byName['51P Pickup'].kind).toBe('added');
      expect(byName['Trip Mode'].kind).toBe('changed');
      expect(result.summary).toEqual({ changed: 2, added: 1, removed: 1, violations: 1, unchanged: 1 });
      expect(result.groups).toEqual(['Group 1', 'Group 2']);
    });
    it('orders the violation first, then protection-relevant changes, unchanged last', () => {
      expect(result.rows[0].name).toBe('87T Slope 1');
      expect(result.rows[0].severity).toBe(3);
      expect(result.rows[1].name).toBe('5th Harmonic Block');
      expect(result.rows[1].severity).toBe(2);
      expect(result.rows.map(r => r.severity)).toEqual([3, 2, 1, 1, 0]);
      expect(result.rows[result.rows.length - 1].kind).toBe('unchanged');
    });
    it('computes the +120 % slope delta as a number', () => {
      expect(byName['87T Slope 1'].deltaPercent).toBeCloseTo(120, 6);
      expect(byName['87T Pickup'].deltaPercent).toBeCloseTo(0, 6);
      expect(byName['Trip Mode'].deltaPercent).toBeNull();
      expect(byName['51P Pickup'].deltaPercent).toBeNull();
    });
  });

  describe('TST-SETCMP-007 seed fixture NTH01_T1_87T v2→v3 (DES-SETCMP-025 ii)', () => {
    const result = compare(SEED_V2, SEED_V3, DE);

    it('finds four changes, no violations and fifteen unchanged settings', () => {
      expect(result.rows.length).toBe(19);
      expect(result.summary).toEqual({ changed: 4, added: 0, removed: 0, violations: 0, unchanged: 15 });
      expect(result.groups).toEqual(['Group 1', 'Group 2']);
    });
    it('orders protection-setting changes before the rest, then group, then name', () => {
      const head = result.rows.slice(0, 4).map(r => [r.settingGroup, r.name, r.severity, r.left?.value, r.right?.value]);
      expect(head).toEqual([
        ['Group 1', '50P Pickup', 2, '9.97', '8.55'],
        ['Group 2', '87T Slope 1', 2, '35', '30'],
        ['Group 1', '2nd Harmonic Block', 1, '16', '17'],
        ['Group 1', 'Post-fault Window', 1, '725', '750']
      ]);
      expect(result.rows.slice(4).every(r => r.kind === 'unchanged' && r.severity === 0)).toBeTrue();
    });
    it('reports signed percentage deltas', () => {
      const deltas = result.rows.slice(0, 4).map(r => r.deltaPercent as number);
      expect(deltas[0]).toBeCloseTo(-14.24, 2);
      expect(deltas[1]).toBeCloseTo(-14.29, 2);
      expect(deltas[2]).toBeCloseTo(6.25, 2);
      expect(deltas[3]).toBeCloseTo(3.45, 2);
      expect(result.rows.filter(r => r.name === '51P Curve')[0].deltaPercent).toBeNull();
    });
  });

  describe('TST-SETCMP-008 visibleRows', () => {
    const rows = compare(KARMA_V2, KARMA_V3, DE).rows;
    it('hides unchanged rows by default and shows them when flagged', () => {
      expect(visibleRows(rows, false, '').length).toBe(4);
      expect(visibleRows(rows, true, '').length).toBe(5);
      expect(visibleRows(rows, true, null).length).toBe(5);
    });
    it('filters by group without touching the summary', () => {
      expect(visibleRows(rows, true, 'Group 2').map(r => r.name)).toEqual(['51P Pickup']);
      expect(visibleRows(rows, false, 'Group 1').length).toBe(3);
      expect(compare(KARMA_V2, KARMA_V3, DE).summary).toEqual({ changed: 2, added: 1, removed: 1, violations: 1, unchanged: 1 });
    });
  });

  describe('TST-SETCMP-009 defaultSelection', () => {
    it('picks ACTIVE vs the previous version', () => {
      expect(defaultSelection(KARMA_HISTORY)).toEqual({ left: 11, right: 12 });
    });
    it('falls back to the newest entry and a null baseline when nothing is lower', () => {
      const only = [{ ...KARMA_HISTORY[0], status: 'SUPERSEDED' }];
      expect(defaultSelection(only)).toEqual({ left: null, right: 12 });
      expect(defaultSelection([])).toEqual({ left: null, right: null });
      expect(compare(null, KARMA_V3, EN).rows.every(r => r.kind === 'added')).toBeTrue();
    });
    it('lets explicit (string) route params win', () => {
      expect(defaultSelection(KARMA_HISTORY, '12', '11')).toEqual({ left: 12, right: 11 });
      expect(defaultSelection(KARMA_HISTORY, undefined, '11')).toEqual({ left: null, right: 11 });
      expect(defaultSelection(KARMA_HISTORY, '11', undefined)).toEqual({ left: 11, right: 12 });
    });
  });

  describe('TST-SETCMP-010 csvText', () => {
    const rows = compare(KARMA_V2, KARMA_V3, DE).rows;
    it('writes the frozen header with both version numbers and one quoted line per row given', () => {
      const text = csvText(KARMA_V2, KARMA_V3, visibleRows(rows, false, ''));
      const lines = text.split('\n');
      expect(lines[0]).toBe('group,ln,setting,unit,v2,v3,kind,violation');
      expect(lines.length).toBe(5);
      expect(lines[1]).toBe('"Group 1","PDIF","87T Slope 1","%","25","55","changed","exceeds maximum 50"');
      expect(lines[4]).toBe('"Group 2","PTOC","51P Pickup","xIn","","1.20","added",""');
    });
    it('uses - for a missing side and doubles inner quotes', () => {
      expect(csvText(null, KARMA_V3, []).split('\n')[0]).toBe('group,ln,setting,unit,-,v3,kind,violation');
      expect(csvText(KARMA_V2, null, []).split('\n')[0]).toBe('group,ln,setting,unit,v2,-,kind,violation');
      const quoted = compare({ ...KARMA_V2, values: [sv({ name: 'Label "A"', value: 'say "hi"' })] }, null, EN).rows;
      expect(csvText(KARMA_V2, null, quoted).split('\n')[1]).toBe('"Group 1","PDIF","Label ""A""","","say ""hi""","","removed",""');
    });
    it('keeps raw wire strings (no locale formatting)', () => {
      const line = csvText(KARMA_V2, KARMA_V3, rows.filter(r => r.name === '87T Pickup')).split('\n')[1];
      expect(line).toBe('"Group 1","PDIF","87T Pickup","pu","0.30","0.3000","unchanged",""');
    });
  });

  describe('TST-SETCMP-011 no null coercion', () => {
    it('keeps null values as strings for classification and never invents a 0 bound', () => {
      const left = { ...KARMA_V2, values: [sv({ name: 'n', value: null }), sv({ name: 'm', value: '5' })] };
      const right = { ...KARMA_V3, values: [sv({ name: 'n', value: null }), sv({ name: 'm', value: '5', minValue: null, maxValue: null })] };
      const rows = compare(left, right, EN).rows;
      const n = rows.filter(r => r.name === 'n')[0];
      const m = rows.filter(r => r.name === 'm')[0];
      expect(n.kind).toBe('unchanged');
      expect(n.deltaPercent).toBeNull();
      expect(n.violation).toBeNull();
      expect(m.violation).toBeNull();
      expect(deltaPercent(sv({ name: 'n', value: null }), sv({ name: 'n', value: '5' }), EN)).toBeNull();
      expect(deltaPercent(sv({ name: 'n', value: '0' }), sv({ name: 'n', value: '5' }), EN)).toBeNull();
    });
    it('treats null vs a value as changed, not as 0', () => {
      const left = { ...KARMA_V2, values: [sv({ name: 'n', value: null })] };
      const right = { ...KARMA_V3, values: [sv({ name: 'n', value: '0' })] };
      expect(compare(left, right, EN).rows[0].kind).toBe('changed');
    });
  });
});
