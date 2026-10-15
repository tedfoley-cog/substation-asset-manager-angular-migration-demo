# Legacy Protractor suite (end-of-life)

These specs drove the 2017–2021 release gates against the AngularJS client. Protractor reached end-of-life
with Angular 15 and the suite has not run since the Chrome 109 driver break. It is kept for reference
only — **the active browser gauntlet is `tests/ui/` (Playwright)** at the repository root.

* `protractor.conf.js` — original configuration (direct Chrome, `baseUrl` on :3000).
* `specs/*.spec.js` — scenarios in Protractor's `element(by.model(...))` style; most locators no longer exist.

Do not add Protractor as a dependency again; `npm run e2e:legacy` deliberately fails.
