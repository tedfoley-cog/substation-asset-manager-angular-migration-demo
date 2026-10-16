import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { LegacyUser } from './legacy-types';

// Angular-side view of the two legacy bus events the migrated screen needs (DES-SETCMP-017, ADR-006).
// Fed exclusively by bridgeLegacyEvents(); Angular code never touches $rootScope.
@Injectable({ providedIn: 'root' })
export class SamEventsService {
  readonly userChanged$ = new Subject<LegacyUser>();
  readonly settingsUploaded$ = new Subject<unknown>();
}
