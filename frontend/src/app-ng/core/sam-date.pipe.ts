import { Inject, Pipe, PipeTransform } from '@angular/core';
import { LegacySessionService } from './legacy-types';
import { SESSION_SERVICE } from './upgrade-providers';

export type SamDateStyle = 'short' | 'date' | 'datetime' | 'seconds';

// Line-for-line port of the AngularJS `samDate` filter (frontend/src/app/core/locale.filters.js), DES-SETCMP-015 / ADR-003.
// Impure, session-driven locale, formatter cache keyed `locale|style` exactly like the filter.
@Pipe({ name: 'samDate', pure: false })
export class SamDatePipe implements PipeTransform {
  private readonly cache: { [key: string]: Intl.DateTimeFormat } = {};

  constructor(@Inject(SESSION_SERVICE) private readonly session: LegacySessionService) {}

  transform(value: string | Date | null | undefined, style?: SamDateStyle): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) {
      return String(value);
    }
    return this.formatter(this.session.locale(), style || 'datetime').format(d);
  }

  private formatter(locale: string, style: SamDateStyle): Intl.DateTimeFormat {
    const key = locale + '|' + style;
    if (!this.cache[key]) {
      const opts: Intl.DateTimeFormatOptions =
        style === 'short' ? { dateStyle: 'short' }
          : style === 'date' ? { year: 'numeric', month: '2-digit', day: '2-digit' }
            : { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: style === 'seconds' ? '2-digit' : undefined, timeZone: 'UTC' };
      this.cache[key] = new Intl.DateTimeFormat(locale, opts);
    }
    return this.cache[key];
  }
}
