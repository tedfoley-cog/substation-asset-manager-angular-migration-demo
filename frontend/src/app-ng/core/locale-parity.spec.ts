import { SamDatePipe } from './sam-date.pipe';
import { SamNumberPipe } from './sam-number.pipe';

// TST-SETCMP-022 — the Angular pipes must produce exactly what the AngularJS samNumber/samDate filters produce.
// Expectations mirror frontend/test/unit/locale.filters.spec.js plus the comparison screen's own cases (ADR-003, DES-SETCMP-015).
describe('SamNumberPipe / SamDatePipe parity with the samNumber / samDate filters', () => {
  const session = { locale: 'en-GB' };
  const sessionService = { locale: () => session.locale, username: () => null, current: () => null, can: () => false };
  let number: SamNumberPipe;
  let date: SamDatePipe;

  beforeEach(() => {
    session.locale = 'en-GB';
    number = new SamNumberPipe(sessionService);
    date = new SamDatePipe(sessionService);
  });

  it('samNumber follows the operator locale', () => {
    expect(number.transform(1234.5)).toBe('1,234.5');
    session.locale = 'de-DE';
    expect(number.transform(1234.5)).toBe('1.234,5');
    expect(number.transform('0.30', 2)).toBe('0,30');
  });

  it('samNumber renders the comparison values and deltas like the legacy screen', () => {
    expect(number.transform('0.30')).toBe('0.3');
    expect(number.transform('0.3000')).toBe('0.3');
    expect(number.transform('1.20')).toBe('1.2');
    expect(number.transform(120, 1)).toBe('120.0');
    expect(number.transform(-14.243, 1)).toBe('-14.2');
    expect(number.transform('0.12345')).toBe('0.1235');
    session.locale = 'de-DE';
    expect(number.transform('0.30')).toBe('0,3');
    expect(number.transform(120, 1)).toBe('120,0');
    expect(number.transform('95')).toBe('95');
    session.locale = 'fr-FR';
    expect(number.transform(1234.5)).toBe(new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 }).format(1234.5));
    expect(number.transform('0.30')).toBe('0,3');
  });

  it('samNumber never coerces blanks to zero and passes non-numeric strings through', () => {
    expect(number.transform(null)).toBe('—');
    expect(number.transform(undefined)).toBe('—');
    expect(number.transform('')).toBe('—');
    expect(number.transform('3-pole')).toBe('3-pole');
    expect(number.transform('600:1')).toBe('600:1');
    expect(number.transform('IEC-VI')).toBe('IEC-VI');
  });

  it('samDate renders ISO instants in the operator locale', () => {
    expect(date.transform('2024-06-02T19:30:11Z', 'date')).toBe('02/06/2024');
    expect(date.transform('2024-06-10T09:00:00Z', 'date')).toBe('10/06/2024');
    session.locale = 'de-DE';
    expect(date.transform('2024-06-02T19:30:11Z', 'date')).toBe('02.06.2024');
    expect(date.transform('2024-06-10T09:00:00Z', 'date')).toBe('10.06.2024');
    expect(date.transform(null)).toBe('—');
    expect(date.transform('')).toBe('—');
    expect(date.transform('not a date')).toBe('not a date');
    expect(date.transform('2024-06-02T19:30:11Z')).toBe(new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date('2024-06-02T19:30:11Z')));
    expect(date.transform('2024-06-02T19:30:11Z', 'seconds')).toContain(':11');
  });

  it('re-evaluates on a locale switch (impure pipes read the session every time)', () => {
    expect(number.transform('0.30')).toBe('0.3');
    session.locale = 'de-DE';
    expect(number.transform('0.30')).toBe('0,3');
    expect(date.transform('2024-06-02T19:30:11Z', 'date')).toBe('02.06.2024');
    session.locale = 'en-GB';
    expect(date.transform('2024-06-02T19:30:11Z', 'date')).toBe('02/06/2024');
  });
});
