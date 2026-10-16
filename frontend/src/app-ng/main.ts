// Angular entry point, loaded by index.html after every legacy AngularJS script (DES-SETCMP-005).
// zone.js comes from the CLI polyfills option (angular.json); it is deliberately not imported here (ADR-001).
import './downgrades';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err: unknown) => console.error('[sam] Angular bootstrap failed', err));
