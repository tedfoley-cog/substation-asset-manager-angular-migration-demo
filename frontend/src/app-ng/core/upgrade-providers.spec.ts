import { TestBed } from '@angular/core/testing';
import { API_CLIENT, EVENT_BUS, SESSION_SERVICE, UI_ROUTER_STATE, upgradedProviders } from './upgrade-providers';

describe('upgradedProviders (TST-SETCMP-023, DES-SETCMP-012)', () => {
  const legacy: { [name: string]: object } = {
    ApiClient: { settingsHistory: () => Promise.resolve([]) },
    SessionService: { locale: () => 'de-DE' },
    EventBus: { EVENTS: {}, subscribe: () => () => undefined, toast: () => undefined },
    $state: { params: {}, href: () => '', go: () => undefined }
  };
  const $injector = { get: jasmine.createSpy('get').and.callFake((name: string) => legacy[name]) };

  beforeEach(() => {
    $injector.get.calls.reset();
    TestBed.configureTestingModule({ providers: [{ provide: '$injector', useValue: $injector }, ...upgradedProviders] });
  });

  it('resolves ApiClient, SessionService, EventBus and $state from the AngularJS injector, once each', () => {
    expect(TestBed.inject(API_CLIENT)).toBe(legacy['ApiClient'] as never);
    expect(TestBed.inject(SESSION_SERVICE)).toBe(legacy['SessionService'] as never);
    expect(TestBed.inject(EVENT_BUS)).toBe(legacy['EventBus'] as never);
    expect(TestBed.inject(UI_ROUTER_STATE)).toBe(legacy['$state'] as never);
    expect(TestBed.inject(API_CLIENT)).toBe(TestBed.inject(API_CLIENT));
    expect($injector.get.calls.allArgs().map(a => a[0]).sort()).toEqual(['$state', 'ApiClient', 'EventBus', 'SessionService']);
  });
});
