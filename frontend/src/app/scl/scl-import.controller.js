(function () {
  'use strict';
  angular.module('sam').controller('SclImportController', ['$scope', '$state', '$stateParams', 'ApiClient', 'SessionService', 'EventBus',
    function ($scope, $state, $stateParams, ApiClient, SessionService, EventBus) {
      $scope.imports = [];
      $scope.selected = null;
      $scope.busy = false;
      $scope.error = null;
      $scope.can = SessionService.can;
      $scope.accepted = '.icd,.cid,.scd,.ssd,.iid';

      function load() {
        return ApiClient.sclImports().then(function (list) {
          $scope.imports = list;
          if ($stateParams.importId) { $scope.open(list.filter(function (i) { return String(i.id) === String($stateParams.importId); })[0]); }
        });
      }
      $scope.open = function (item) {
        if (!item) { return; }
        ApiClient.sclImport(item.id).then(function (detail) { $scope.selected = detail; });
        $state.go('.', { importId: item.id }, { notify: false });
      };
      $scope.close = function () { $scope.selected = null; $state.go('.', { importId: null }, { notify: false }); };

      $scope.onFiles = function (files) {
        if (!files.length) { return; }
        var file = files[0];
        $scope.error = null;
        var ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
        if ($scope.accepted.split(',').indexOf(ext) < 0) {
          $scope.error = { message: 'Unsupported file type ' + ext, details: ['Accepted SCL extensions: ' + $scope.accepted.replace(/,/g, ', ')] };
          return;
        }
        $scope.busy = true;
        ApiClient.importScl(file).then(function (result) {
          $scope.selected = result;
          if (result.status === 'COMPLETED') { EventBus.toast('success', 'SCL import complete', result.message); }
          else { EventBus.toast('warn', 'SCL import failed', result.message); }
          EventBus.publish(EventBus.EVENTS.SCL_IMPORTED, result);
          return load();
        }).catch(function (rej) { $scope.error = rej.data || { message: 'Upload failed' }; })
          .finally(function () { $scope.busy = false; });
      };
      $scope.matched = function (detail) { return detail ? detail.ieds.filter(function (i) { return i.matchedIedId; }).length : 0; };
      $scope.goIed = function (row) { if (row.matchedIedId) { $state.go('iedDetail', { id: row.matchedIedId }); } };

      var unsub = EventBus.subscribe(EventBus.EVENTS.USER_CHANGED, load);
      $scope.$on('$destroy', unsub);
      load();
    }]);
})();
