// Angular entry point. WI-01 ships the toolchain only: the bundle is built but not yet referenced by index.html,
// and nothing bootstraps until WI-02 (DES-SETCMP-005).
export { AppModule } from './app.module';
