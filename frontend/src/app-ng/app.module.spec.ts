import { TestBed } from '@angular/core/testing';
import { UpgradeModule } from '@angular/upgrade/static';
import { AppModule, LEGACY_MODULE } from './app.module';
import { SamEventsService } from './core/sam-events.service';

describe('AppModule hybrid bootstrap (WI-SETCMP-02, DES-SETCMP-005)', () => {
  it('ngDoBootstrap hands the whole document to UpgradeModule for the "sam" module with strict DI, then bridges the bus once', () => {
    TestBed.configureTestingModule({ imports: [AppModule] });
    const upgrade = TestBed.inject(UpgradeModule);
    const subscribe = jasmine.createSpy('subscribe').and.returnValue(() => undefined);
    const bus = { EVENTS: { USER_CHANGED: 'sam:userChanged', SETTINGS_UPLOADED: 'sam:settingsUploaded' }, subscribe };
    const bootstrap = spyOn(upgrade, 'bootstrap').and.callFake(() => {
      (upgrade as unknown as { $injector: unknown }).$injector = { get: (name: string) => (name === 'EventBus' ? bus : undefined) };
    });

    TestBed.inject(AppModule).ngDoBootstrap();

    expect(bootstrap).toHaveBeenCalledOnceWith(document.documentElement, [LEGACY_MODULE], { strictDi: true });
    expect(LEGACY_MODULE).toBe('sam');
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(subscribe.calls.argsFor(0)[0]).toBe('sam:userChanged');
    expect(subscribe.calls.argsFor(1)[0]).toBe('sam:settingsUploaded');
    expect(TestBed.inject(SamEventsService)).toBeTruthy();
  });
});
