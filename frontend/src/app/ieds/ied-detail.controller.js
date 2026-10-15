(function () {
  'use strict';
  angular.module('sam').controller('IedDetailController', ['$scope', '$state', '$stateParams', '$q', 'ApiClient', 'SessionService', 'EventBus',
    function ($scope, $state, $stateParams, $q, ApiClient, SessionService, EventBus) {
      var iedId = $stateParams.id;
      $scope.tab = $stateParams.tab || 'overview';
      $scope.ied = null;
      $scope.history = [];
      $scope.records = [];
      $scope.firmwareOptions = [];
      $scope.statuses = ['IN_SERVICE', 'COMMISSIONING', 'MAINTENANCE', 'DECOMMISSIONED'];
      $scope.modal = null;
      $scope.compare = { left: null, right: null };
      $scope.upload = { open: false, draft: false, comment: '', rows: [], errors: [] };
      $scope.can = SessionService.can;

      function load() {
        return $q.all([ApiClient.ied(iedId), ApiClient.settingsHistory(iedId), ApiClient.records({ iedId: iedId })]).then(function (r) {
          $scope.ied = r[0];
          $scope.history = r[1];
          $scope.records = r[2];
          var active = $scope.history.filter(function (h) { return h.status === 'ACTIVE'; })[0];
          var previous = $scope.history.filter(function (h) { return active && h.versionNo < active.versionNo; })[0];
          $scope.compare.right = active ? active.id : ($scope.history[0] ? $scope.history[0].id : null);
          $scope.compare.left = previous ? previous.id : null;
        }).catch(function () { $scope.notFound = true; });
      }

      $scope.setTab = function (tab) { $scope.tab = tab; $state.go('.', { tab: tab }, { notify: false }); };

      // --- firmware assignment modal -------------------------------------------------------------
      $scope.openFirmwareModal = function () {
        ApiClient.firmware($scope.ied.platform).then(function (list) {
          $scope.firmwareOptions = list;
          $scope.modal = { kind: 'firmware', firmwareVersionId: $scope.ied.firmware ? $scope.ied.firmware.id : null, busy: false, error: null };
        });
      };
      $scope.selectedFirmware = function () {
        return $scope.firmwareOptions.filter(function (f) { return $scope.modal && f.id === $scope.modal.firmwareVersionId; })[0];
      };
      $scope.confirmFirmware = function () {
        $scope.modal.busy = true;
        ApiClient.assignFirmware($scope.ied.id, $scope.modal.firmwareVersionId).then(function (ied) {
          $scope.ied = ied;
          $scope.modal = null;
          EventBus.toast('success', 'Firmware assigned', ied.name + ' now on ' + ied.firmware.version);
          EventBus.publish(EventBus.EVENTS.FIRMWARE_CHANGED, ied);
        }).catch(function (rej) {
          $scope.modal.error = rej.data ? rej.data.message + (rej.data.details && rej.data.details.length ? ': ' + rej.data.details.join('; ') : '') : 'Request failed';
        }).finally(function () { if ($scope.modal) { $scope.modal.busy = false; } });
      };

      // --- status change -------------------------------------------------------------------------
      $scope.openStatusModal = function () { $scope.modal = { kind: 'status', status: $scope.ied.status, reason: '', busy: false, error: null }; };
      $scope.confirmStatus = function () {
        $scope.modal.busy = true;
        ApiClient.changeStatus($scope.ied.id, $scope.modal.status, $scope.modal.reason).then(function (ied) {
          $scope.ied = ied;
          $scope.modal = null;
          EventBus.toast('success', 'Status updated', ied.name + ' is now ' + ied.status.toLowerCase().replace('_', ' '));
        }).catch(function (rej) { $scope.modal.error = rej.data ? rej.data.message : 'Request failed'; })
          .finally(function () { if ($scope.modal) { $scope.modal.busy = false; } });
      };
      $scope.closeModal = function () { $scope.modal = null; };

      // --- settings upload (inline form) -----------------------------------------------------------
      $scope.openUpload = function () {
        $scope.upload = { open: true, draft: false, comment: '', errors: [], rows: [] };
        var source = $scope.history.filter(function (h) { return h.status === 'ACTIVE'; })[0] || $scope.history[0];
        if (!source) { return; }
        ApiClient.settingsFile(source.id).then(function (file) {
          $scope.upload.rows = file.values.map(function (v) { return angular.copy(v); });
          $scope.upload.sourceVersion = file.versionNo;
        });
      };
      $scope.removeRow = function (row) { $scope.upload.rows.splice($scope.upload.rows.indexOf(row), 1); };
      $scope.addRow = function () { $scope.upload.rows.push({ settingGroup: 'Group 1', lnClass: '', name: '', value: '', unit: '', minValue: null, maxValue: null }); };
      $scope.rowOutOfRange = function (row) {
        if (row.value === '' || row.value === null || row.value === undefined) { return false; }
        var n = Number(String(row.value).replace(',', '.'));
        if (isNaN(n)) { return false; }
        return (row.minValue !== null && row.minValue !== undefined && n < Number(row.minValue)) || (row.maxValue !== null && row.maxValue !== undefined && n > Number(row.maxValue));
      };
      $scope.submitUpload = function (form) {
        $scope.upload.errors = [];
        if (form.$invalid) { $scope.upload.errors.push('Complete the highlighted fields before uploading.'); return; }
        $scope.upload.busy = true;
        var payload = { comment: $scope.upload.comment, draft: $scope.upload.draft, values: $scope.upload.rows.map(function (r) {
          return { settingGroup: r.settingGroup, lnClass: r.lnClass, name: r.name, value: r.value, unit: r.unit, minValue: r.minValue, maxValue: r.maxValue }; }) };
        ApiClient.uploadSettings($scope.ied.id, payload).then(function (created) {
          $scope.upload.open = false;
          EventBus.toast('success', 'Settings uploaded', created.filename + ' stored as v' + created.versionNo + (created.status === 'DRAFT' ? ' (draft)' : ''));
          EventBus.publish(EventBus.EVENTS.SETTINGS_UPLOADED, created);
          return load();
        }).catch(function (rej) {
          var body = rej.data || {};
          $scope.upload.errors = [body.message || 'Upload failed'].concat(body.details || []);
        }).finally(function () { $scope.upload.busy = false; });
      };

      $scope.goCompare = function () { $state.go('settingsCompare', { id: iedId, left: $scope.compare.left, right: $scope.compare.right }); };
      $scope.versionLabel = function (h) { return 'v' + h.versionNo + ' · ' + h.status.toLowerCase() + ' · ' + h.uploadedBy; };

      var unsub = EventBus.subscribe(EventBus.EVENTS.USER_CHANGED, load);
      $scope.$on('$destroy', unsub);
      load();
    }]);
})();
