import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LegacyApiClient, LegacyEventBus, LegacySessionService, UiRouterState } from '../core/legacy-types';
import { SamEventsService } from '../core/sam-events.service';
import { SamNumberPipe } from '../core/sam-number.pipe';
import { SamDatePipe } from '../core/sam-date.pipe';
import { API_CLIENT, EVENT_BUS, SESSION_SERVICE, UI_ROUTER_STATE } from '../core/upgrade-providers';
import { CSV_DOWNLOAD, CsvDownload } from './csv-download.token';
import { CompareRow, HistoryEntry, Selection, SettingsFile, Summary, compare, csvText, defaultSelection, visibleRows } from './settings-compare.logic';

interface SelectionOverride {
  left: number | null;
  right: number | null;
}

const EMPTY_SUMMARY: Summary = { changed: 0, added: 0, removed: 0, violations: 0, unchanged: 0 };

// Settings comparison screen (DES-SETCMP-011). Downgraded into the existing ui-router `settingsCompare` state
// (ADR-002, DES-014); reads its parameters from the upgraded $state. All comparison rules live in
// settings-compare.logic.ts — this class only loads data, holds view state and formats for display.
@Component({
  selector: 'sam-settings-compare',
  templateUrl: './settings-compare.component.html',
  providers: [SamNumberPipe, SamDatePipe]
})
export class SettingsCompareComponent implements OnInit, OnDestroy {
  loading = true;
  history: HistoryEntry[] = [];
  left: SettingsFile | null = null;
  right: SettingsFile | null = null;
  rows: CompareRow[] = [];
  summary: Summary = { ...EMPTY_SUMMARY };
  groups: string[] = [];
  selection: Selection = { left: null, right: null };
  showUnchanged = false;
  groupFilter = '';
  iedName: string | undefined;

  private readonly destroy$ = new Subject<void>();

  constructor(
    @Inject(API_CLIENT) private readonly api: LegacyApiClient,
    @Inject(SESSION_SERVICE) private readonly session: LegacySessionService,
    @Inject(EVENT_BUS) private readonly bus: LegacyEventBus,
    @Inject(UI_ROUTER_STATE) private readonly $state: UiRouterState,
    @Inject(CSV_DOWNLOAD) private readonly download: CsvDownload,
    private readonly events: SamEventsService,
    private readonly samNumber: SamNumberPipe,
    private readonly samDate: SamDatePipe
  ) {}

  get iedId(): string {
    return String(this.$state.params.id ?? '');
  }

  ngOnInit(): void {
    this.events.userChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
    this.events.settingsUploaded$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(override?: SelectionOverride): Promise<void> {
    this.loading = true;
    const wanted = override || { left: this.$state.params.left, right: this.$state.params.right };
    return Promise.resolve(this.api.settingsHistory(this.iedId))
      .then(history => {
        this.history = history;
        this.selection = defaultSelection(history, wanted.left, wanted.right);
        const leftId = this.selection.left;
        const rightId = this.selection.right;
        return Promise.all([
          leftId ? this.api.settingsFile(leftId) : Promise.resolve(null),
          rightId ? this.api.settingsFile(rightId) : Promise.resolve(null)
        ]);
      })
      .then(([left, right]) => {
        this.left = left;
        this.right = right;
        this.iedName = (this.right || this.left || {}).iedName;
        const result = compare(this.left, this.right, this.session.locale());
        this.rows = result.rows;
        this.summary = result.summary;
        this.groups = result.groups;
      })
      .catch(() => {
        // Surfaced by apiErrorInterceptor → sam:apiError → shell toast (DES-SETCMP-018); the screen keeps its last rows.
      })
      .finally(() => {
        this.loading = false;
      });
  }

  reselect(): void {
    const params = { id: this.iedId, left: this.selection.left, right: this.selection.right };
    this.$state.go('settingsCompare', params);
    this.load({ left: this.selection.left, right: this.selection.right });
  }

  swap(): void {
    const l = this.selection.left;
    this.selection.left = this.selection.right;
    this.selection.right = l;
    this.reselect();
  }

  visibleRows(): CompareRow[] {
    return visibleRows(this.rows, this.showUnchanged, this.groupFilter);
  }

  rowClass(r: CompareRow): string {
    return r.violation ? 'diff-row-violation' : 'diff-row-' + r.kind;
  }

  kindBadge(r: CompareRow): string {
    return r.violation ? 'badge-bad' : r.kind === 'changed' ? 'badge-warn' : r.kind === 'added' ? 'badge-ok' : 'badge-muted';
  }

  versionLabel(h: HistoryEntry): string {
    return 'v' + h.versionNo + ' · ' + h.status.toLowerCase() + ' · ' + this.samDate.transform(h.uploadedAt, 'date');
  }

  delta(r: CompareRow): string {
    const pct = r.deltaPercent;
    if (pct === null) {
      return '';
    }
    return (pct > 0 ? '+' : '') + this.samNumber.transform(pct, 1) + ' %';
  }

  trackByKey(_index: number, r: CompareRow): string {
    return r.key;
  }

  iedsHref(): string {
    return this.$state.href('ieds');
  }

  breadcrumbHref(): string {
    const file = this.selection.right ? this.right : this.left;
    const id = file ? file.iedId : this.iedId;
    return this.$state.href('iedDetail', { id, tab: 'settings' });
  }

  exportCsv(): void {
    const rows = this.visibleRows();
    this.download((this.iedName || 'settings') + '_compare.csv', csvText(this.left, this.right, rows));
    this.bus.toast('info', 'Export', rows.length + ' rows exported');
  }
}
