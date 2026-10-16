import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { LegacyApiClient, LegacySessionService, UiRouterState } from '../core/legacy-types';
import { SamDatePipe } from '../core/sam-date.pipe';
import { SamEventsService } from '../core/sam-events.service';
import { SamNumberPipe } from '../core/sam-number.pipe';
import { API_CLIENT, EVENT_BUS, SESSION_SERVICE, UI_ROUTER_STATE } from '../core/upgrade-providers';
import { CSV_DOWNLOAD } from './csv-download.token';
import { KARMA_HISTORY, KARMA_V2, KARMA_V3 } from './fixtures/nth01-t1-87t.fixture';
import { SettingsCompareComponent } from './settings-compare.component';
import { HistoryEntry, SettingsFile } from './settings-compare.logic';

const FROZEN_HOOKS = [
  'compare-summary', 'sum-changed', 'sum-added', 'sum-removed', 'sum-violations', 'compare-left', 'compare-swap', 'compare-right',
  'compare-group', 'show-unchanged', 'export-csv', 'violation-banner', 'compare-table', 'compare-row'
];

describe('SettingsCompareComponent (DES-SETCMP-011, TST-SETCMP-014..021)', () => {
  let fixture: ComponentFixture<SettingsCompareComponent>;
  let component: SettingsCompareComponent;
  let session: { locale: string };
  let api: jasmine.SpyObj<LegacyApiClient>;
  let state: UiRouterState & { go: jasmine.Spy; href: jasmine.Spy };
  let toast: jasmine.Spy;
  let download: jasmine.Spy;
  let events: SamEventsService;

  function flush(): Promise<void> {
    // load() chains native promises: three ticks (history → files → compare) plus finally.
    return new Promise<void>(resolve => setTimeout(resolve, 0)).then(() => fixture.detectChanges());
  }

  function setup(params: { left?: string; right?: string } = {}, files: { [id: number]: SettingsFile } = { 11: KARMA_V2, 12: KARMA_V3 }, history: HistoryEntry[] = KARMA_HISTORY): Promise<void> {
    session = { locale: 'de-DE' };
    api = jasmine.createSpyObj<LegacyApiClient>('ApiClient', ['settingsHistory', 'settingsFile']);
    api.settingsHistory.and.callFake(() => Promise.resolve(history));
    api.settingsFile.and.callFake((id: number) => Promise.resolve(files[id]));
    state = {
      params: { id: '7', ...params },
      href: jasmine.createSpy('href').and.callFake((name: string, p?: { id?: unknown; tab?: string }) => (p ? `#!/${name}/${p.id}?tab=${p.tab}` : `#!/${name}`)),
      go: jasmine.createSpy('go')
    };
    toast = jasmine.createSpy('toast');
    download = jasmine.createSpy('downloadCsv');
    const sessionService: LegacySessionService = { locale: () => session.locale, username: () => 'mbrandt', current: () => null, can: () => true };

    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [SettingsCompareComponent, SamNumberPipe, SamDatePipe],
      providers: [
        { provide: API_CLIENT, useValue: api },
        { provide: SESSION_SERVICE, useValue: sessionService },
        { provide: EVENT_BUS, useValue: { EVENTS: { USER_CHANGED: 'sam:userChanged', SETTINGS_UPLOADED: 'sam:settingsUploaded' }, subscribe: () => () => undefined, toast } },
        { provide: UI_ROUTER_STATE, useValue: state },
        { provide: CSV_DOWNLOAD, useValue: download }
      ]
    });
    events = TestBed.inject(SamEventsService);
    fixture = TestBed.createComponent(SettingsCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return flush();
  }

  function text(selector: string): string {
    return (fixture.nativeElement.querySelector(selector) as HTMLElement).textContent?.trim() ?? '';
  }
  function hook(name: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-test="${name}"]`);
  }
  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[data-test="compare-row"]'));
  }

  it('TST-014 labels versions like the samDate filter and offers "— none —" only on the baseline', async () => {
    await setup();
    const left = hook('compare-left') as HTMLSelectElement;
    const right = hook('compare-right') as HTMLSelectElement;
    expect(Array.from(left.options).map(o => o.text)).toEqual(['— none —', 'v3 · active · 10.06.2024', 'v2 · superseded · 01.02.2023']);
    expect(Array.from(right.options).map(o => o.text)).toEqual(['v3 · active · 10.06.2024', 'v2 · superseded · 01.02.2023']);
    expect(left.selectedIndex).toBe(2);
    expect(right.selectedIndex).toBe(0);
    session.locale = 'en-GB';
    fixture.detectChanges();
    expect(left.options[1].text).toBe('v3 · active · 10/06/2024');
  });

  it('TST-015 defaults to active vs previous, swap()/reselect() go to settingsCompare and reload; swapping clears the violation', async () => {
    await setup();
    expect(component.selection).toEqual({ left: 11, right: 12 });
    expect(component.left?.versionNo).toBe(2);
    expect(component.right?.versionNo).toBe(3);
    expect(component.summary.violations).toBe(1);

    (hook('compare-swap') as HTMLButtonElement).click();
    await flush();
    expect(state.go).toHaveBeenCalledOnceWith('settingsCompare', { id: '7', left: 12, right: 11 });
    expect(component.summary.violations).toBe(0);
    expect(text('[data-test="sum-violations"]')).toBe('0');
    expect(hook('violation-banner')).toBeNull();

    component.selection.left = null;
    component.reselect();
    await flush();
    expect(state.go).toHaveBeenCalledWith('settingsCompare', { id: '7', left: null, right: 11 });
    expect(component.left).toBeNull();
    expect(component.rows.every(r => r.kind === 'added')).toBeTrue();
  });

  it('TST-015b honours explicit route params', async () => {
    await setup({ left: '12', right: '11' });
    expect(component.selection).toEqual({ left: 12, right: 11 });
    expect(api.settingsFile.calls.allArgs().map(a => a[0])).toEqual([12, 11]);
  });

  it('TST-016 shows the violation banner text and status-down only while violations > 0', async () => {
    await setup();
    expect(hook('violation-banner')?.textContent).toContain('1 setting(s) in v3 fall outside the permitted range.');
    expect(hook('violation-banner')?.textContent).toContain('This file must not be activated until the values are corrected or an engineering deviation is recorded.');
    expect(hook('sum-violations')?.classList.contains('status-down')).toBeTrue();
    expect(text('[data-test="sum-violations"]')).toBe('1');

    component.swap();
    await flush();
    expect(hook('violation-banner')).toBeNull();
    expect(hook('sum-violations')?.classList.contains('status-down')).toBeFalse();
  });

  it('TST-017 renders every frozen hook, row attribute, cell class and heading text', async () => {
    await setup();
    FROZEN_HOOKS.forEach(name => expect(hook(name)).withContext(name).not.toBeNull());
    expect(text('h1')).toBe('Settings comparison — NTH01_T1_87T');
    expect(text('.breadcrumb')).toBe('IEDs / NTH01_T1_87T / Compare settings');
    expect(text('p.subtitle')).toBe('Baseline v2 → candidate v3. Rows ordered by protection impact; range violations first.');
    expect(Array.from(fixture.nativeElement.querySelectorAll('.legend span')).map(s => (s as HTMLElement).textContent)).toEqual(['changed', 'added in candidate', 'removed in candidate', 'outside permitted range']);
    expect(Array.from(fixture.nativeElement.querySelectorAll('.stat .label')).map(s => (s as HTMLElement).textContent)).toEqual(['Changed', 'Added', 'Removed', 'Range violations', 'Unchanged']);
    expect(Array.from(fixture.nativeElement.querySelectorAll('thead th')).map(s => (s as HTMLElement).textContent)).toEqual(['Group', 'LN', 'Setting', 'v2', 'v3', 'Unit', 'Δ', 'Permitted', 'Change']);
    expect(text('[data-test="compare-swap"]')).toBe('⇄');
    expect(text('[data-test="export-csv"]')).toBe('Export CSV');
    expect((hook('compare-table') as HTMLElement).classList.contains('compare-grid')).toBeTrue();
    expect(hook('compare-table')?.hasAttribute('sam-sticky-header')).toBeFalse();

    const all = rows();
    expect(all.length).toBe(4);
    expect(text('[data-test="sum-changed"]')).toBe('2');
    expect(text('[data-test="sum-added"]')).toBe('1');
    expect(text('[data-test="sum-removed"]')).toBe('1');
    const first = all[0];
    expect(first.getAttribute('data-setting')).toBe('87T Slope 1');
    expect(first.getAttribute('data-kind')).toBe('violation');
    expect(first.classList.contains('diff-row-violation')).toBeTrue();
    expect(first.querySelector('.diff-cell-left')?.textContent).toBe('25');
    expect(first.querySelector('.diff-cell-right')?.textContent).toBe('55');
    expect(first.querySelector('.badge')?.textContent).toBe('exceeds maximum 50');
    expect(first.querySelector('.badge')?.classList.contains('badge-bad')).toBeTrue();
    expect(first.querySelector('td.num.mono.small')?.textContent).toBe('+120,0 %');
    expect(all.map(r => r.getAttribute('data-kind'))).toEqual(['violation', 'removed', 'changed', 'added']);
    expect(all.map(r => r.className)).toEqual(['diff-row-violation', 'diff-row-removed', 'diff-row-changed', 'diff-row-added']);
    expect(all.map(r => r.querySelector('.badge')?.className)).toEqual(['badge badge-bad', 'badge badge-muted', 'badge badge-warn', 'badge badge-ok']);
    expect(hook('breadcrumb')).toBeNull();
    expect((fixture.nativeElement.querySelectorAll('.breadcrumb a') as NodeListOf<HTMLAnchorElement>)[0].getAttribute('href')).toBe('#!/ieds');
    expect((fixture.nativeElement.querySelectorAll('.breadcrumb a') as NodeListOf<HTMLAnchorElement>)[1].getAttribute('href')).toBe('#!/iedDetail/7?tab=settings');
    expect(state.href).toHaveBeenCalledWith('iedDetail', { id: 7, tab: 'settings' });
  });

  it('TST-017b show-unchanged and group filter drive the visible rows, never the summary', async () => {
    await setup();
    const checkbox = hook('show-unchanged') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.showUnchanged).toBeTrue();
    expect(rows().length).toBe(5);
    expect(rows()[4].getAttribute('data-kind')).toBe('unchanged');
    expect(rows()[4].querySelector('.diff-cell-right')?.textContent).toBe('0,3');

    const group = hook('compare-group') as HTMLSelectElement;
    expect(Array.from(group.options).map(o => o.text)).toEqual(['All groups', 'Group 1', 'Group 2']);
    group.value = 'Group 2';
    group.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.groupFilter).toBe('Group 2');
    expect(rows().map(r => r.getAttribute('data-setting'))).toEqual(['51P Pickup']);
    expect(component.summary).toEqual({ changed: 2, added: 1, removed: 1, violations: 1, unchanged: 1 });
  });

  it('TST-018 renders — for a missing side, blank bounds and 3-pole verbatim; empty state text when nothing is visible', async () => {
    await setup();
    const byName: { [n: string]: HTMLElement } = {};
    rows().forEach(r => (byName[r.getAttribute('data-setting') as string] = r));
    expect(byName['51P Pickup'].querySelector('.diff-cell-left')?.textContent).toBe('—');
    expect(byName['51P Pickup'].querySelector('.diff-cell-right')?.textContent).toBe('1,2');
    expect(byName['5th Harmonic Block'].querySelector('.diff-cell-right')?.textContent).toBe('—');
    expect(byName['Trip Mode'].querySelector('.diff-cell-left')?.textContent).toBe('3-pole');
    expect(byName['Trip Mode'].querySelector('.diff-cell-right')?.textContent).toBe('1-pole');
    expect(byName['Trip Mode'].querySelector('td.mono.small.muted')?.textContent).toBe('');
    expect(byName['Trip Mode'].querySelector('td.num.mono.small')?.textContent).toBe('');
    expect(byName['87T Slope 1'].querySelector('td.mono.small.muted')?.textContent).toBe('15 … 50');

    component.groupFilter = 'Group 3';
    fixture.detectChanges();
    expect(hook('compare-table')).toBeNull();
    expect(text('.empty')).toBe('No differences between the selected versions — tick “show unchanged” to list all 1 settings.');
    component.showUnchanged = true;
    fixture.detectChanges();
    expect(text('.empty')).toBe('No differences between the selected versions.');
  });

  it('TST-019 exportCsv downloads <iedName>_compare.csv with the visible rows and toasts the count', async () => {
    await setup();
    (hook('export-csv') as HTMLButtonElement).click();
    expect(download).toHaveBeenCalledTimes(1);
    const [filename, csv] = download.calls.mostRecent().args as [string, string];
    expect(filename).toBe('NTH01_T1_87T_compare.csv');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('group,ln,setting,unit,v2,v3,kind,violation');
    expect(lines.length).toBe(5);
    expect(lines[1]).toBe('"Group 1","PDIF","87T Slope 1","%","25","55","changed","exceeds maximum 50"');
    expect(toast).toHaveBeenCalledOnceWith('info', 'Export', '4 rows exported');

    component.showUnchanged = true;
    component.groupFilter = 'Group 2';
    component.exportCsv();
    expect((download.calls.mostRecent().args[1] as string).split('\n').length).toBe(2);
    expect(toast).toHaveBeenCalledWith('info', 'Export', '1 rows exported');
  });

  it('TST-020 reloads on userChanged$ / settingsUploaded$ and releases the subscriptions on destroy', async () => {
    await setup();
    expect(api.settingsHistory).toHaveBeenCalledTimes(1);
    events.userChanged$.next({ username: 'aokafor', locale: 'en-GB', role: 'VIEWER', permissions: [] });
    await flush();
    expect(api.settingsHistory).toHaveBeenCalledTimes(2);
    events.settingsUploaded$.next({ iedId: 7, versionNo: 4 });
    await flush();
    expect(api.settingsHistory).toHaveBeenCalledTimes(3);

    fixture.destroy();
    events.userChanged$.next({ username: 'mbrandt', locale: 'de-DE', role: 'ENGINEER', permissions: [] });
    events.settingsUploaded$.next({});
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    expect(api.settingsHistory).toHaveBeenCalledTimes(3);
    expect(events.userChanged$.observed).toBeFalse();
    expect(events.settingsUploaded$.observed).toBeFalse();
  });

  it('TST-021 a rejected settingsHistory leaves loading false, rows unchanged and does not throw', async () => {
    await setup();
    expect(component.rows.length).toBe(5);
    api.settingsHistory.and.callFake(() => Promise.reject({ status: 502, message: 'upstream' }));
    await component.load();
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(component.rows.length).toBe(5);
    expect(rows().length).toBe(4);
    expect(toast).not.toHaveBeenCalled();
  });

  it('TST-016b pipe re-render: a locale switch re-renders numbers without reload', async () => {
    await setup();
    const pickup = () => rows().filter(r => r.getAttribute('data-setting') === '87T Slope 1')[0].querySelector('td.num.mono.small')?.textContent;
    expect(pickup()).toBe('+120,0 %');
    session.locale = 'en-GB';
    fixture.detectChanges();
    expect(pickup()).toBe('+120.0 %');
    expect(fixture.debugElement.query(By.css('h1'))).not.toBeNull();
  });
});
