import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { bridgeLegacyEvents } from './core/legacy-event-bridge';
import { SamDatePipe } from './core/sam-date.pipe';
import { SamEventsService } from './core/sam-events.service';
import { SamNumberPipe } from './core/sam-number.pipe';
import { upgradedProviders } from './core/upgrade-providers';
import { SettingsCompareComponent } from './settings/settings-compare.component';

export const LEGACY_MODULE = 'sam';

// Hybrid root module (ADR-001, DES-SETCMP-005). Angular owns the single bootstrap: index.html carries no ng-app,
// and UpgradeModule starts the AngularJS "sam" application with strict DI once Angular itself is ready.
// No RouterModule: ui-router stays the only router (ADR-002).
@NgModule({
  imports: [BrowserModule, FormsModule, UpgradeModule],
  declarations: [SettingsCompareComponent, SamNumberPipe, SamDatePipe],
  providers: [...upgradedProviders]
})
export class AppModule {
  constructor(private readonly upgrade: UpgradeModule, private readonly events: SamEventsService) {}

  ngDoBootstrap(): void {
    this.upgrade.bootstrap(document.documentElement, [LEGACY_MODULE], { strictDi: true });
    bridgeLegacyEvents(this.upgrade.$injector, this.events);
  }
}
