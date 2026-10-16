import { downgradeComponent } from '@angular/upgrade/static';
import { SettingsCompareComponent } from './settings/settings-compare.component';

// Registration site for every downgraded Angular component (DES-SETCMP-014). Imported first by main.ts: all classic
// scripts have run, so the `sam` module exists, and this executes before bootstrapModule. `angular` is the page global
// from vendor/angular/angular.js — AngularJS is not bundled a second time.
const legacyAngular = (window as unknown as { angular: angular.IAngularStatic }).angular;

legacyAngular.module('sam').directive('samSettingsCompare', downgradeComponent({ component: SettingsCompareComponent }) as angular.IDirectiveFactory);
