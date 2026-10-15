---
name: ui-gauntlet
description: Run and extend the mandatory Playwright gauntlet in tests/ui; keep data-test hooks stable across the AngularJS→Angular migration.
---
`cd tests/ui && npm ci && npx playwright install --with-deps chromium && npx playwright test` with the stack running
(`run-the-stack`). Scenarios map to `tests/ui/UI_TEST_PLAN.md`; keep `data-test` attributes and visible domain text
(IED names, versions, values) identical when migrating a screen (UM-20). Add a scenario for every new behaviour; assert
content, not counts.
