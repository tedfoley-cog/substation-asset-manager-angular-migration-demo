(function () {
  'use strict';
  angular.module('sam').controller('RecordsController', ['$scope', '$state', '$stateParams', '$window', 'ApiClient', 'SessionService', 'EventBus',
    function ($scope, $state, $stateParams, $window, ApiClient, SessionService, EventBus) {
      $scope.filters = { substationId: $stateParams.substationId || '', iedId: $stateParams.iedId || '', downloaded: $stateParams.downloaded || '', from: $stateParams.from || '', to: $stateParams.to || '' };
      $scope.substations = [];
      $scope.ieds = [];
      $scope.records = [];
      $scope.loading = true;
      $scope.can = SessionService.can;
      $scope.downloading = {};

      ApiClient.substations().then(function (l) { $scope.substations = l; });
      ApiClient.ieds({}).then(function (l) { $scope.ieds = l; });

      function toInstant(dateStr, endOfDay) { return dateStr ? dateStr + (endOfDay ? 'T23:59:59Z' : 'T00:00:00Z') : null; }
      function load() {
        $scope.loading = true;
        var params = { substationId: $scope.filters.substationId, iedId: $scope.filters.iedId, downloaded: $scope.filters.downloaded, from: toInstant($scope.filters.from), to: toInstant($scope.filters.to, true) };
        ApiClient.records(params).then(function (l) { $scope.records = l; }).finally(function () { $scope.loading = false; });
        $state.go('.', $scope.filters, { notify: false });
      }
      $scope.apply = load;
      $scope.reset = function () { $scope.filters = { substationId: '', iedId: '', downloaded: '', from: '', to: '' }; load(); };
      $scope.pending = function () { return $scope.records.filter(function (r) { return !r.downloaded; }).length; };
      $scope.totalBytes = function () { return $scope.records.reduce(function (a, r) { return a + r.sizeBytes; }, 0); };

      $scope.download = function (rec) {
        $scope.downloading[rec.id] = true;
        ApiClient.downloadRecord(rec.id).then(function (res) {
          var blob = new Blob([res.data], { type: 'text/plain' });
          var a = $window.document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = rec.recordId + '.cfg';
          a.click();
          EventBus.toast('success', 'COMTRADE retrieved', rec.recordId + '.cfg (' + rec.analogChannels + 'A/' + rec.digitalChannels + 'D @ ' + rec.sampleRateHz + ' Hz)');
          return ApiClient.record(rec.id).then(function (fresh) { angular.extend(rec, fresh); });
        }).catch(angular.noop).finally(function () { delete $scope.downloading[rec.id]; });
      };

      var unsub = EventBus.subscribe(EventBus.EVENTS.USER_CHANGED, load);
      $scope.$on('$destroy', unsub);
      load();
    }]);
})();
