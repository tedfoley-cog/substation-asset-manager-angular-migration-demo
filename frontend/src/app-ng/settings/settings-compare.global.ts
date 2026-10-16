// TEMPORARY (WI-SETCMP-03/04, removed in WI-SETCMP-05 — DES-SETCMP-009): esbuild IIFE entry exposing the comparison
// engine as the page global `samCompareLogic` so the thin AngularJS SettingsCompareController and its unchanged
// Karma spec can consume the TypeScript module until the Angular component replaces the controller.
export * from './settings-compare.logic';
export { downloadCsv } from './csv-download';
