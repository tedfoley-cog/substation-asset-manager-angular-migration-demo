(function () {
  'use strict';
  angular.module('sam').controller('IedListController', ['$scope', '$state', '$stateParams', '$timeout', 'ApiClient', 'EventBus',
    function ($scope, $state, $stateParams, $timeout, ApiClient, EventBus) {
      $scope.deviceTypes = ['TRANSFORMER_DIFFERENTIAL', 'LINE_DISTANCE', 'FEEDER_PROTECTION', 'BAY_CONTROLLER', 'MERGING_UNIT'];
      $scope.statuses = ['IN_SERVICE', 'COMMISSIONING', 'MAINTENANCE', 'DECOMMISSIONED'];
      $scope.filters = { substationId: $stateParams.substationId || '', deviceType: $stateParams.deviceType || '', status: $stateParams.status || '', q: $stateParams.q || '' };
      $scope.sort = { field: ($stateParams.sort || 'name').replace(/^-/, ''), desc: ($stateParams.sort || '').charAt(0) === '-' };
      $scope.substations = [];
      $scope.ieds = [];
      $scope.loading = true;
      $scope.selected = null;
      var searchTimer;

      ApiClient.substations().then(function (list) { $scope.substations = list; });

      function load() {
        $scope.loading = true;
        ApiClient.ieds($scope.filters).then(function (list) { $scope.ieds = list; }).finally(function () { $scope.loading = false; });
        $state.go('.', angular.extend({}, $scope.filters, { sort: ($scope.sort.desc ? '-' : '') + $scope.sort.field }), { notify: false });
      }

      $scope.apply = load;
      $scope.onSearch = function () { $timeout.cancel(searchTimer); searchTimer = $timeout(load, 250); };
      $scope.reset = function () { $scope.filters = { substationId: '', deviceType: '', status: '', q: '' }; load(); };

      $scope.sortBy = function (field) {
        if ($scope.sort.field === field) { $scope.sort.desc = !$scope.sort.desc; } else { $scope.sort = { field: field, desc: false }; }
        $state.go('.', { sort: ($scope.sort.desc ? '-' : '') + field }, { notify: false });
      };
      $scope.sortExpr = function (ied) {
        var f = $scope.sort.field;
        if (f === 'firmware') { return ied.firmware ? ied.firmware.version : ''; }
        if (f === 'substation') { return ied.substationCode + ' ' + ied.bayName; }
        return ied[f];
      };
      $scope.sortIndicator = function (field) { return $scope.sort.field === field ? ($scope.sort.desc ? '▼' : '▲') : ''; };

      $scope.select = function (ied) {
        $scope.selected = $scope.selected && $scope.selected.id === ied.id ? null : ied;
        if ($scope.selected) { EventBus.publish(EventBus.EVENTS.IED_SELECTED, $scope.selected); }
      };
      $scope.openDetail = function (ied, tab) { $state.go('iedDetail', { id: ied.id, tab: tab || 'overview' }); };

      $scope.countBy = function (status) { return $scope.ieds.filter(function (i) { return i.status === status; }).length; };
      $scope.eolCount = function () { return $scope.ieds.filter(function (i) { return i.firmware && i.firmware.endOfLife; }).length; };

      var unsubs = [
        EventBus.subscribe(EventBus.EVENTS.USER_CHANGED, load),
        EventBus.subscribe(EventBus.EVENTS.FIRMWARE_CHANGED, load)
      ];
      $scope.$on('$destroy', function () { unsubs.forEach(function (u) { u(); }); });
      load();
    }]);
})();
