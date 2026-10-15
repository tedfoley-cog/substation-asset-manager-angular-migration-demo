INSERT INTO app_user (username, display_name, role, locale, active, created_at) VALUES
 ('rvasquez',  'R. Vasquez',    'PROTECTION_ADMIN', 'en-GB', TRUE,  '2021-03-02T08:00:00Z'),
 ('mbrandt',   'M. Brandt',     'ENGINEER',         'de-DE', TRUE,  '2021-06-14T08:00:00Z'),
 ('aokafor',   'A. Okafor',     'ENGINEER',         'en-GB', TRUE,  '2022-01-10T08:00:00Z'),
 ('lchen',     'L. Chen',       'VIEWER',           'en-GB', TRUE,  '2022-09-21T08:00:00Z'),
 ('sdubois',   'S. Dubois',     'AUDITOR',          'fr-FR', TRUE,  '2023-02-01T08:00:00Z'),
 ('jkowalski', 'J. Kowalski',   'ENGINEER',         'en-GB', FALSE, '2020-11-05T08:00:00Z');

INSERT INTO firmware_version (platform, version, released_on, approved, end_of_life, notes) VALUES
 ('RP-700 Transformer Differential', '2.31.07', '2019-05-20', TRUE,  TRUE,  'Superseded. Known issue: harmonic restraint latch after CT saturation (FSN-19-044).'),
 ('RP-700 Transformer Differential', '2.42.15', '2021-02-08', TRUE,  FALSE, 'Fleet standard for 87T units.'),
 ('RP-700 Transformer Differential', '2.50.03', '2023-09-12', FALSE, FALSE, 'Under type-test. Adds IEC 61850 Ed2.1 reporting.'),
 ('RP-500 Line Distance',            '4.08.11', '2020-07-01', TRUE,  FALSE, 'Fleet standard for 21/85 line units.'),
 ('RP-500 Line Distance',            '4.12.02', '2023-11-30', TRUE,  FALSE, 'Approved 2024-03. Fixes zone-2 timer reset on evolving faults.'),
 ('RP-300 Feeder Protection',        '1.19.20', '2018-10-15', TRUE,  TRUE,  'End of life. No security patches after 2024-12.'),
 ('RP-300 Feeder Protection',        '1.26.04', '2022-04-26', TRUE,  FALSE, 'Fleet standard for feeder 50/51 units.'),
 ('BC-900 Bay Controller',           '7.3.1',   '2021-09-09', TRUE,  FALSE, 'Fleet standard.'),
 ('BC-900 Bay Controller',           '7.5.0',   '2024-01-18', FALSE, FALSE, 'Pilot only (two bays).'),
 ('MU-120 Merging Unit',             '3.0.4',   '2022-12-01', TRUE,  FALSE, 'IEC 61869-9 sampled values, 4000 Hz.');

INSERT INTO substation (code, name, region, nominal_kv, latitude, longitude, commissioned_on, operator_notes) VALUES
 ('NTH-01', 'Northgate 132/33 kV',        'North',   132.0, 53.483959, -2.244644, '1998-06-12', 'Two 60 MVA transformers, double busbar at 132 kV.'),
 ('NTH-02', 'Harrow Moor 275/132 kV',     'North',   275.0, 53.800755, -1.549077, '1986-11-02', 'Grid supply point. Bay 275-T1 under refurbishment 2024.'),
 ('CEN-01', 'Ridgeway 400/132 kV',        'Central', 400.0, 52.486243, -1.890401, '1979-03-20', 'Four 240 MVA SGTs. Digital substation pilot on 132 kV side.'),
 ('STH-01', 'Marsh Lane 33/11 kV',        'South',   33.0,  51.454514, -2.587910, '2004-09-30', 'Urban primary. Twelve 11 kV feeders.'),
 ('STH-02', 'Fenwick 132/33 kV',          'South',   132.0, 50.909698, -1.404351, '2011-05-17', 'Process-bus pilot (MU-120 merging units) on 33 kV board.');

INSERT INTO bay (substation_id, name, bay_type, nominal_kv) VALUES
 ((SELECT id FROM substation WHERE code='NTH-01'), 'T1 132/33 kV',    'TRANSFORMER', 132.0),
 ((SELECT id FROM substation WHERE code='NTH-01'), 'T2 132/33 kV',    'TRANSFORMER', 132.0),
 ((SELECT id FROM substation WHERE code='NTH-01'), 'Line 1 to NTH-02','LINE',        132.0),
 ((SELECT id FROM substation WHERE code='NTH-01'), '33 kV Bus Section','BUSBAR',     33.0),
 ((SELECT id FROM substation WHERE code='NTH-02'), 'SGT1 275/132 kV', 'TRANSFORMER', 275.0),
 ((SELECT id FROM substation WHERE code='NTH-02'), 'Line 1 to NTH-01','LINE',        132.0),
 ((SELECT id FROM substation WHERE code='NTH-02'), 'Line 2 to CEN-01','LINE',        275.0),
 ((SELECT id FROM substation WHERE code='CEN-01'), 'SGT2 400/132 kV', 'TRANSFORMER', 400.0),
 ((SELECT id FROM substation WHERE code='CEN-01'), 'SGT3 400/132 kV', 'TRANSFORMER', 400.0),
 ((SELECT id FROM substation WHERE code='CEN-01'), 'Line 2 to NTH-02','LINE',        275.0),
 ((SELECT id FROM substation WHERE code='CEN-01'), '132 kV Bus Coupler','BUSBAR',    132.0),
 ((SELECT id FROM substation WHERE code='STH-01'), 'T1 33/11 kV',     'TRANSFORMER', 33.0),
 ((SELECT id FROM substation WHERE code='STH-01'), 'Feeder F03 Dock Rd','FEEDER',    11.0),
 ((SELECT id FROM substation WHERE code='STH-01'), 'Feeder F07 Albion St','FEEDER',  11.0),
 ((SELECT id FROM substation WHERE code='STH-02'), 'T1 132/33 kV',    'TRANSFORMER', 132.0),
 ((SELECT id FROM substation WHERE code='STH-02'), '33 kV Feeder 2',  'FEEDER',      33.0),
 ((SELECT id FROM substation WHERE code='STH-02'), '33 kV Feeder 5',  'FEEDER',      33.0);
