import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';

// Hybrid root module. WI-01 only compiles it; WI-02 adds ngDoBootstrap (UpgradeModule.bootstrap, strictDi — DES-SETCMP-005).
@NgModule({
  imports: [BrowserModule, UpgradeModule],
  declarations: [],
  providers: []
})
export class AppModule {}
