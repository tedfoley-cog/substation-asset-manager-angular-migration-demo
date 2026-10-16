import { LegacyEventBus, LegacyUser } from './legacy-types';
import { LEGACY_SERVICE_NAMES } from './upgrade-providers';
import { SamEventsService } from './sam-events.service';

// The single EventBus → RxJS bridge (DES-SETCMP-017). Called once from AppModule.ngDoBootstrap after the AngularJS
// injector exists. Only the two existing events are forwarded; SAM_EVENTS is not extended (CS-04).
export function bridgeLegacyEvents($injector: angular.auto.IInjectorService, events: SamEventsService): Array<() => void> {
  const bus = $injector.get(LEGACY_SERVICE_NAMES.EVENT_BUS) as LegacyEventBus;
  return [
    bus.subscribe(bus.EVENTS.USER_CHANGED, payload => events.userChanged$.next(payload as LegacyUser)),
    bus.subscribe(bus.EVENTS.SETTINGS_UPLOADED, payload => events.settingsUploaded$.next(payload))
  ];
}
