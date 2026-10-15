(function () {
  'use strict';
  // Settings comparison. NOTE (2018): the comparison engine lives in this controller because it was
  // ported straight from the old Excel macro; nobody has had time to move it into a service.
  angular.module('sam').controller('SettingsCompareController', ['$scope', '$state', '$stateParams', '$q', '$filter', 'ApiClient', 'SessionService', 'EventBus',
    function ($scope, $state, $stateParams, $q, $filter, ApiClient, SessionService, EventBus) {
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

      // Tolerance used when deciding whether a numeric setting "really" changed (relays round on export).
      var EPSILON = 0.0005;

      function toNumber(raw) {
        if (raw === null || raw === undefined || raw === '') { return NaN; }
        var s = String(raw).trim();
        // de-DE exports use a decimal comma; en-GB a point.
        if (SessionService.locale().indexOf('de') === 0 && /^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) { s = s.replace(/\./g, '').replace(',', '.'); }
        else { s = s.replace(',', '.'); }
        return Number(s);
      }

      function classify(leftVal, rightVal) {
        if (leftVal === undefined) { return 'added'; }
        if (rightVal === undefined) { return 'removed'; }
        var l = toNumber(leftVal.value), r = toNumber(rightVal.value);
        if (!isNaN(l) && !isNaN(r)) { return Math.abs(l - r) < EPSILON ? 'unchanged' : 'changed'; }
        return String(leftVal.value) === String(rightVal.value) ? 'unchanged' : 'changed';
      }

      function rangeViolation(v) {
        if (!v) { return null; }
        var n = toNumber(v.value);
        if (isNaN(n)) { return null; }
        if (v.minValue !== null && v.minValue !== undefined && n < Number(v.minValue)) { return 'below minimum ' + v.minValue; }
        if (v.maxValue !== null && v.maxValue !== undefined && n > Number(v.maxValue)) { return 'exceeds maximum ' + v.maxValue; }
        return null;
      }

      function deltaText(leftVal, rightVal) {
        var l = toNumber(leftVal && leftVal.value), r = toNumber(rightVal && rightVal.value);
        if (isNaN(l) || isNaN(r) || l === 0) { return ''; }
        var pct = ((r - l) / Math.abs(l)) * 100;
        return (pct > 0 ? '+' : '') + $filter('samNumber')(pct, 1) + ' %';
      }

      function severity(row) {
        if (row.violation) { return 3; }
        if (row.kind === 'removed' && /PDIF|PTOC|PIOC|PDIS|PTRC|RBRF/.test(row.lnClass)) { return 2; }
        if (row.kind === 'changed' && /Pickup|Setting|Reach|Slope|Time Delay|Zone/i.test(row.name)) { return 2; }
        if (row.kind === 'unchanged') { return 0; }
        return 1;
      }

      function compare(leftFile, rightFile) {
        var byKey = {};
        function key(v) { return v.settingGroup + '|' + v.name; }
        (leftFile ? leftFile.values : []).forEach(function (v) { byKey[key(v)] = { left: v }; });
        (rightFile ? rightFile.values : []).forEach(function (v) { (byKey[key(v)] = byKey[key(v)] || {}).right = v; });
        var rows = Object.keys(byKey).map(function (k) {
          var pair = byKey[k];
          var ref = pair.right || pair.left;
          var row = { key: k, settingGroup: ref.settingGroup, lnClass: ref.lnClass, name: ref.name, unit: ref.unit, minValue: ref.minValue, maxValue: ref.maxValue,
            left: pair.left, right: pair.right, kind: classify(pair.left, pair.right), violation: rangeViolation(pair.right), delta: deltaText(pair.left, pair.right) };
          row.severity = severity(row);
          return row;
        });
        rows.sort(function (a, b) { return b.severity - a.severity || a.settingGroup.localeCompare(b.settingGroup) || a.name.localeCompare(b.name); });
        var summary = { changed: 0, added: 0, removed: 0, violations: 0, unchanged: 0 };
        rows.forEach(function (r) { summary[r.kind === 'unchanged' ? 'unchanged' : r.kind]++; if (r.violation) { summary.violations++; } });
        var seen = {};
        $scope.groups = rows.map(function (r) { return r.settingGroup; }).filter(function (g) { return seen[g] ? false : (seen[g] = true); }).sort();
        return { rows: rows, summary: summary };
      }

      function load(override) {
        $scope.loading = true;
        ApiClient.settingsHistory(iedId).then(function (history) {
          $scope.history = history;
          var leftId = override ? override.left : $stateParams.left, rightId = override ? override.right : $stateParams.right;
          if (!rightId) { var active = history.filter(function (h) { return h.status === 'ACTIVE'; })[0] || history[0]; rightId = active && active.id; }
          if (!leftId) { var prev = history.filter(function (h) { return h.id !== Number(rightId) && h.versionNo < (history.filter(function (x) { return x.id === Number(rightId); })[0] || {}).versionNo; })[0]; leftId = prev && prev.id; }
          $scope.selection = { left: leftId ? Number(leftId) : null, right: rightId ? Number(rightId) : null };
          return $q.all([leftId ? ApiClient.settingsFile(leftId) : $q.resolve(null), rightId ? ApiClient.settingsFile(rightId) : $q.resolve(null)]);
        }).then(function (files) {
          $scope.left = files[0];
          $scope.right = files[1];
          $scope.iedName = ($scope.right || $scope.left || {}).iedName;
          var result = compare($scope.left, $scope.right);
          $scope.rows = result.rows;
          $scope.summary = result.summary;
        }).finally(function () { $scope.loading = false; });
      }

      $scope.reselect = function () { $state.go('.', { left: $scope.selection.left, right: $scope.selection.right }); load({ left: $scope.selection.left, right: $scope.selection.right }); };
      $scope.swap = function () { var l = $scope.selection.left; $scope.selection.left = $scope.selection.right; $scope.selection.right = l; $scope.reselect(); };
      $scope.visibleRows = function () {
        return $scope.rows.filter(function (r) { return ($scope.showUnchanged || r.kind !== 'unchanged') && (!$scope.groupFilter || r.settingGroup === $scope.groupFilter); });
      };
      $scope.rowClass = function (r) { return r.violation ? 'diff-row-violation' : 'diff-row-' + r.kind; };
      $scope.versionLabel = function (h) { return 'v' + h.versionNo + ' · ' + h.status.toLowerCase() + ' · ' + $filter('samDate')(h.uploadedAt, 'date'); };
      $scope.exportCsv = function () {
        var lines = ['group,ln,setting,unit,' + ($scope.left ? 'v' + $scope.left.versionNo : '-') + ',' + ($scope.right ? 'v' + $scope.right.versionNo : '-') + ',kind,violation'];
        $scope.visibleRows().forEach(function (r) {
          lines.push([r.settingGroup, r.lnClass, r.name, r.unit || '', r.left ? r.left.value : '', r.right ? r.right.value : '', r.kind, r.violation || ''].map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','));
        });
        var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = ($scope.iedName || 'settings') + '_compare.csv';
        a.click();
        EventBus.toast('info', 'Export', lines.length - 1 + ' rows exported');
      };

      var unsubs = [EventBus.subscribe(EventBus.EVENTS.USER_CHANGED, load), EventBus.subscribe(EventBus.EVENTS.SETTINGS_UPLOADED, load)];
      $scope.$on('$destroy', function () { unsubs.forEach(function (u) { u(); }); });
      load();
    }]);
})();
