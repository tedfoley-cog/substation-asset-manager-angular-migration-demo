(function () {
  'use strict';
  // TEMPORARY (WI-SETCMP-03/04, removed in WI-SETCMP-05 — DES-SETCMP-009). Exposes the framework-neutral comparison
  // engine (src/app-ng/settings/settings-compare.logic.ts, bundled by `npm run build:logic` as window.samCompareLogic)
  // to the thin AngularJS SettingsCompareController. Lazy read, so script order does not matter.
  angular.module('sam').factory('SettingsCompareLogic', ['$window', function ($window) {
    return $window.samCompareLogic;
  }]);
})();
