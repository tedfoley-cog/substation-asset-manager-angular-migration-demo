import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';

export const LEGACY_MODULE = 'sam';

// Hybrid root module (ADR-001, DES-SETCMP-005). Angular owns the single bootstrap: index.html carries no ng-app,
// and UpgradeModule starts the AngularJS "sam" application with strict DI once Angular itself is ready.
@NgModule({
  imports: [BrowserModule, UpgradeModule],
  declarations: [],
  providers: []
})
export class AppModule {
  constructor(private readonly upgrade: UpgradeModule) {}

  ngDoBootstrap(): void {
    this.upgrade.bootstrap(document.documentElement, [LEGACY_MODULE], { strictDi: true });
  }
}
