// Minimal typings of the AngularJS singletons the Angular side consumes through upgraded providers (DES-SETCMP-012).
// They describe the existing JavaScript services in frontend/src/app/core/*.js; nothing is reimplemented here (UM-11).
import { HistoryEntry, SettingsFile } from '../settings/settings-compare.logic';

export interface LegacyUser {
  username: string;
  locale: string;
  role: string;
  permissions: string[];
}

export interface LegacyApiClient {
  settingsHistory(iedId: string | number): PromiseLike<HistoryEntry[]>;
  settingsFile(fileId: number): PromiseLike<SettingsFile>;
}

export interface LegacySessionService {
  username(): string | null;
  current(): LegacyUser | null;
  locale(): string;
  can(permission: string): boolean;
}

export interface LegacyEventBus {
  EVENTS: { USER_CHANGED: string; SETTINGS_UPLOADED: string; [name: string]: string };
  publish(name: string, payload?: unknown): void;
  subscribe(name: string, handler: (payload: unknown) => void): () => void;
  toast(level: string, title: string, message: string): void;
}

export interface UiRouterStateParams {
  id?: string;
  left?: string | null;
  right?: string | null;
  [name: string]: unknown;
}

export interface UiRouterState {
  params: UiRouterStateParams;
  href(state: string, params?: object): string;
  go(state: string, params?: object): unknown;
}
