import { HistoryEntry, SettingValue, SettingsFile } from '../settings-compare.logic';

// (i) Karma synthetic NTH01_T1_87T v2→v3 fixture, copied verbatim from
// frontend/test/unit/settings-compare.controller.spec.js (DES-SETCMP-025 i).
export const KARMA_HISTORY: HistoryEntry[] = [
  { id: 12, iedId: 7, versionNo: 3, status: 'ACTIVE', uploadedAt: '2024-06-10T09:00:00Z', uploadedBy: 'mbrandt' },
  { id: 11, iedId: 7, versionNo: 2, status: 'SUPERSEDED', uploadedAt: '2023-02-01T09:00:00Z', uploadedBy: 'aokafor' }
];

export const KARMA_V2: SettingsFile = {
  id: 11, iedId: 7, iedName: 'NTH01_T1_87T', versionNo: 2, values: [
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '87T Pickup', value: '0.30', unit: 'pu', minValue: '0.10', maxValue: '1.00' },
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '87T Slope 1', value: '25', unit: '%', minValue: '15', maxValue: '50' },
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '5th Harmonic Block', value: '35', unit: '%', minValue: '10', maxValue: '50' },
    { settingGroup: 'Group 1', lnClass: 'PTRC', name: 'Trip Mode', value: '3-pole', unit: null, minValue: null, maxValue: null }
  ]
};

export const KARMA_V3: SettingsFile = {
  id: 12, iedId: 7, iedName: 'NTH01_T1_87T', versionNo: 3, values: [
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '87T Pickup', value: '0.3000', unit: 'pu', minValue: '0.10', maxValue: '1.00' },
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '87T Slope 1', value: '55', unit: '%', minValue: '15', maxValue: '50' },
    { settingGroup: 'Group 1', lnClass: 'PTRC', name: 'Trip Mode', value: '1-pole', unit: null, minValue: null, maxValue: null },
    { settingGroup: 'Group 2', lnClass: 'PTOC', name: '51P Pickup', value: '1.20', unit: 'xIn', minValue: '0.50', maxValue: '4.00' }
  ]
};

// (ii) Seed-derived fixture: backend V4__settings_history.sql, NTH01_T1_87T_v002.rsf → _v003.rsf (19 values each),
// DES-SETCMP-025 ii. Ids are synthetic; values, units and bounds are the seed strings.
type Tuple = [string, string, string, string, string | null, string | null, string | null];
function values(rows: Tuple[]): SettingValue[] {
  return rows.map(([settingGroup, lnClass, name, value, unit, minValue, maxValue]) => ({ settingGroup, lnClass, name, value, unit, minValue, maxValue }));
}

export const SEED_V2: SettingsFile = {
  id: 102, iedId: 7, iedName: 'NTH01_T1_87T', versionNo: 2, values: values([
    ['Group 1', 'PDIF', '87T Pickup', '0.30', 'pu', '0.10', '1.00'],
    ['Group 1', 'PDIF', '87T Slope 1', '25', '%', '15', '50'],
    ['Group 1', 'PDIF', '87T Slope 2', '60', '%', '40', '90'],
    ['Group 1', 'PDIF', '87T Breakpoint 1', '1.50', 'pu', '1.00', '3.00'],
    ['Group 1', 'PDIF', '87T Breakpoint 2', '3.00', 'pu', '2.00', '6.00'],
    ['Group 1', 'PDIF', '87T Unrestrained Pickup', '8.0', 'pu', '4.0', '16.0'],
    ['Group 1', 'PDIF', '2nd Harmonic Block', '16', '%', '5', '30'],
    ['Group 1', 'PDIF', '5th Harmonic Block', '35', '%', '15', '50'],
    ['Group 1', 'PTOC', '51P Pickup', '1.20', 'pu', '0.50', '4.00'],
    ['Group 1', 'PTOC', '51P Curve', 'IEC-VI', null, null, null],
    ['Group 1', 'PTOC', '51P Time Dial', '0.45', null, '0.05', '1.50'],
    ['Group 1', 'PIOC', '50P Pickup', '9.97', 'pu', '2.0', '20.0'],
    ['Group 1', 'PTUV', '27 Pickup', '0.80', 'pu', '0.50', '0.95'],
    ['Group 1', 'RDRE', 'Pre-fault Window', '300', 'ms', '50', '1000'],
    ['Group 1', 'RDRE', 'Post-fault Window', '725', 'ms', '100', '3000'],
    ['Group 1', 'TCTR', 'HV CT Ratio', '600:1', null, null, null],
    ['Group 1', 'TCTR', 'LV CT Ratio', '2000:1', null, null, null],
    ['Group 2', 'PDIF', '87T Pickup', '0.40', 'pu', '0.10', '1.00'],
    ['Group 2', 'PDIF', '87T Slope 1', '35', '%', '15', '50']
  ])
};

export const SEED_V3: SettingsFile = {
  id: 103, iedId: 7, iedName: 'NTH01_T1_87T', versionNo: 3, values: values([
    ['Group 1', 'PDIF', '87T Pickup', '0.30', 'pu', '0.10', '1.00'],
    ['Group 1', 'PDIF', '87T Slope 1', '25', '%', '15', '50'],
    ['Group 1', 'PDIF', '87T Slope 2', '60', '%', '40', '90'],
    ['Group 1', 'PDIF', '87T Breakpoint 1', '1.50', 'pu', '1.00', '3.00'],
    ['Group 1', 'PDIF', '87T Breakpoint 2', '3.00', 'pu', '2.00', '6.00'],
    ['Group 1', 'PDIF', '87T Unrestrained Pickup', '8.0', 'pu', '4.0', '16.0'],
    ['Group 1', 'PDIF', '2nd Harmonic Block', '17', '%', '5', '30'],
    ['Group 1', 'PDIF', '5th Harmonic Block', '35', '%', '15', '50'],
    ['Group 1', 'PTOC', '51P Pickup', '1.20', 'pu', '0.50', '4.00'],
    ['Group 1', 'PTOC', '51P Curve', 'IEC-VI', null, null, null],
    ['Group 1', 'PTOC', '51P Time Dial', '0.45', null, '0.05', '1.50'],
    ['Group 1', 'PIOC', '50P Pickup', '8.55', 'pu', '2.0', '20.0'],
    ['Group 1', 'PTUV', '27 Pickup', '0.80', 'pu', '0.50', '0.95'],
    ['Group 1', 'RDRE', 'Pre-fault Window', '300', 'ms', '50', '1000'],
    ['Group 1', 'RDRE', 'Post-fault Window', '750', 'ms', '100', '3000'],
    ['Group 1', 'TCTR', 'HV CT Ratio', '600:1', null, null, null],
    ['Group 1', 'TCTR', 'LV CT Ratio', '2000:1', null, null, null],
    ['Group 2', 'PDIF', '87T Pickup', '0.40', 'pu', '0.10', '1.00'],
    ['Group 2', 'PDIF', '87T Slope 1', '30', '%', '15', '50']
  ])
};
