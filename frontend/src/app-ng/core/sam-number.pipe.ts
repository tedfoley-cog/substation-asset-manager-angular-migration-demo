import { Inject, Pipe, PipeTransform } from '@angular/core';
import { LegacySessionService } from './legacy-types';
import { SESSION_SERVICE } from './upgrade-providers';

// Line-for-line port of the AngularJS `samNumber` filter (frontend/src/app/core/locale.filters.js), DES-SETCMP-015 / ADR-003.
// Impure: the operator locale comes from the session on every evaluation, so a user switch re-renders without a reload.
// LOCALE_ID is deliberately not used.
@Pipe({ name: 'samNumber', pure: false })
export class SamNumberPipe implements PipeTransform {
  constructor(@Inject(SESSION_SERVICE) private readonly session: LegacySessionService) {}

  transform(value: string | number | null | undefined, fractionDigits?: number): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
    if (isNaN(n)) {
      return String(value);
    }
    const opts: Intl.NumberFormatOptions =
      fractionDigits !== undefined ? { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits } : { maximumFractionDigits: 4 };
    return new Intl.NumberFormat(this.session.locale(), opts).format(n);
  }
}
