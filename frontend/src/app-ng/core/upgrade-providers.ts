import { InjectionToken, Provider } from '@angular/core';
import { LegacyApiClient, LegacyEventBus, LegacySessionService, UiRouterState } from './legacy-types';

// The AngularJS singletons, upgraded once via $injector factories (DES-SETCMP-012, ADR-006). Registered only in AppModule.
// Every request issued through API_CLIENT still crosses userHeaderInterceptor / apiErrorInterceptor (REQ-SETCMP-024).
export const API_CLIENT = new InjectionToken<LegacyApiClient>('sam.ApiClient');
export const SESSION_SERVICE = new InjectionToken<LegacySessionService>('sam.SessionService');
export const EVENT_BUS = new InjectionToken<LegacyEventBus>('sam.EventBus');
export const UI_ROUTER_STATE = new InjectionToken<UiRouterState>('sam.$state');

export const LEGACY_SERVICE_NAMES = {
  API_CLIENT: 'ApiClient',
  SESSION_SERVICE: 'SessionService',
  EVENT_BUS: 'EventBus',
  UI_ROUTER_STATE: '$state'
} as const;

export const upgradedProviders: Provider[] = [
  { provide: API_CLIENT, useFactory: (i: angular.auto.IInjectorService) => i.get(LEGACY_SERVICE_NAMES.API_CLIENT), deps: ['$injector'] },
  { provide: SESSION_SERVICE, useFactory: (i: angular.auto.IInjectorService) => i.get(LEGACY_SERVICE_NAMES.SESSION_SERVICE), deps: ['$injector'] },
  { provide: EVENT_BUS, useFactory: (i: angular.auto.IInjectorService) => i.get(LEGACY_SERVICE_NAMES.EVENT_BUS), deps: ['$injector'] },
  { provide: UI_ROUTER_STATE, useFactory: (i: angular.auto.IInjectorService) => i.get(LEGACY_SERVICE_NAMES.UI_ROUTER_STATE), deps: ['$injector'] }
];
