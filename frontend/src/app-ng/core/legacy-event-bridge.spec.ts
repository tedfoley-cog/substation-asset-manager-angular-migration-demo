import { bridgeLegacyEvents } from './legacy-event-bridge';
import { LegacyUser } from './legacy-types';
import { SamEventsService } from './sam-events.service';

describe('bridgeLegacyEvents (TST-SETCMP-023, DES-SETCMP-017)', () => {
  const handlers: { [name: string]: Array<(payload: unknown) => void> } = {};
  const bus = {
    EVENTS: { USER_CHANGED: 'sam:userChanged', SETTINGS_UPLOADED: 'sam:settingsUploaded', TOAST: 'sam:toast' },
    subscribe: jasmine.createSpy('subscribe').and.callFake((name: string, handler: (payload: unknown) => void) => {
      (handlers[name] = handlers[name] || []).push(handler);
      return () => undefined;
    })
  };
  const $injector = { get: (name: string) => (name === 'EventBus' ? bus : undefined) } as unknown as angular.auto.IInjectorService;

  it('subscribes exactly once per legacy event and forwards payloads to the RxJS subjects', () => {
    const events = new SamEventsService();
    const users: LegacyUser[] = [];
    const uploads: unknown[] = [];
    events.userChanged$.subscribe(u => users.push(u));
    events.settingsUploaded$.subscribe(p => uploads.push(p));

    const unsubs = bridgeLegacyEvents($injector, events);

    expect(bus.subscribe).toHaveBeenCalledTimes(2);
    expect(Object.keys(handlers).sort()).toEqual(['sam:settingsUploaded', 'sam:userChanged']);
    expect(handlers['sam:userChanged'].length).toBe(1);
    expect(handlers['sam:settingsUploaded'].length).toBe(1);
    expect(unsubs.length).toBe(2);

    const user: LegacyUser = { username: 'mbrandt', locale: 'de-DE', role: 'ENGINEER', permissions: [] };
    handlers['sam:userChanged'][0](user);
    handlers['sam:settingsUploaded'][0]({ iedId: 7, versionNo: 4 });
    expect(users).toEqual([user]);
    expect(uploads).toEqual([{ iedId: 7, versionNo: 4 }]);
  });
});
