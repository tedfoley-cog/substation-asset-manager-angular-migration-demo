(function () {
  'use strict';
  // Settings comparison — thin controller (WI-SETCMP-03, DES-SETCMP-010). The comparison engine lives in
  // src/app-ng/settings/settings-compare.logic.ts and reaches this controller through the SettingsCompareLogic bridge.
  // Retired with its template in WI-SETCMP-05 once the Angular component owns the settingsCompare state.
  angular.module('sam').controller('SettingsCompareController', ['$scope', '$state', '$stateParams', '$q', '$filter', 'ApiClient', 'SessionService', 'EventBus', 'SettingsCompareLogic',
    function ($scope, $state, $stateParams, $q, $filter, ApiClient, SessionService, EventBus, SettingsCompareLogic) {
      var Logic = SettingsCompareLogic;
      var iedId = $stateParams.id;
      $scope.loading = true;
      $scope.history = [];
      $scope.left = null;
      $scope.right = null;
      $scope.rows = [];
      $scope.summary = { changed: 0, added: 0, removed: 0, violations: 0, unchanged: 0 };
      $scope.showUnchanged = false;
      $scope.groupFilter = '';
      $scope.groups = [];

      function deltaText(pct) {
        if (pct === null || pct === undefined) { return ''; }
        return (pct > 0 ? '+' : '') + $filter('samNumber')(pct, 1) + ' %';
      }

      function load(override) {
        $scope.loading = true;
        ApiClient.settingsHistory(iedId).then(function (history) {
          $scope.history = history;
          var wanted = override || { left: $stateParams.left, right: $stateParams.right };
          $scope.selection = Logic.defaultSelection(history, wanted.left, wanted.right);
          var leftId = $scope.selection.left, rightId = $scope.selection.right;
          return $q.all([leftId ? ApiClient.settingsFile(leftId) : $q.resolve(null), rightId ? ApiClient.settingsFile(rightId) : $q.resolve(null)]);
        }).then(function (files) {
          $scope.left = files[0];
          $scope.right = files[1];
          $scope.iedName = ($scope.right || $scope.left || {}).iedName;
          var result = Logic.compare($scope.left, $scope.right, SessionService.locale());
          $scope.rows = result.rows.map(function (r) { r.delta = deltaText(r.deltaPercent); return r; });
          $scope.summary = result.summary;
          $scope.groups = result.groups;
        }).finally(function () { $scope.loading = false; });
      }

      $scope.reselect = function () { $state.go('.', { left: $scope.selection.left, right: $scope.selection.right }); load({ left: $scope.selection.left, right: $scope.selection.right }); };
      $scope.swap = function () { var l = $scope.selection.left; $scope.selection.left = $scope.selection.right; $scope.selection.right = l; $scope.reselect(); };
      $scope.visibleRows = function () { return Logic.visibleRows($scope.rows, $scope.showUnchanged, $scope.groupFilter); };
      $scope.rowClass = function (r) { return r.violation ? 'diff-row-violation' : 'diff-row-' + r.kind; };
      $scope.versionLabel = function (h) { return 'v' + h.versionNo + ' · ' + h.status.toLowerCase() + ' · ' + $filter('samDate')(h.uploadedAt, 'date'); };
      $scope.exportCsv = function () {
        var rows = $scope.visibleRows();
        Logic.downloadCsv(($scope.iedName || 'settings') + '_compare.csv', Logic.csvText($scope.left, $scope.right, rows));
        EventBus.toast('info', 'Export', rows.length + ' rows exported');
      };

      var unsubs = [EventBus.subscribe(EventBus.EVENTS.USER_CHANGED, load), EventBus.subscribe(EventBus.EVENTS.SETTINGS_UPLOADED, load)];
      $scope.$on('$destroy', function () { unsubs.forEach(function (u) { u(); }); });
      load();
    }]);
})();
