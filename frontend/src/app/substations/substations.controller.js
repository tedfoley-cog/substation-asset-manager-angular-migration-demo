(function () {
  'use strict';
  angular.module('sam').controller('SubstationsController', ['$scope', '$state', '$stateParams', 'ApiClient', 'EventBus',
    function ($scope, $state, $stateParams, ApiClient, EventBus) {
      $scope.loading = true;
      $scope.region = $stateParams.region || '';
      $scope.substations = [];
      $scope.regions = [];
      $scope.totals = { bays: 0, ieds: 0 };

      function load() {
        $scope.loading = true;
        ApiClient.substations($scope.region).then(function (list) {
          $scope.substations = list;
          $scope.totals = list.reduce(function (acc, s) { acc.bays += s.bayCount; acc.ieds += s.iedCount; return acc; }, { bays: 0, ieds: 0 });
        }).finally(function () { $scope.loading = false; });
      }
      ApiClient.substations().then(function (all) {
        var seen = {};
        $scope.regions = all.map(function (s) { return s.region; }).filter(function (r) { return seen[r] ? false : (seen[r] = true); }).sort();
      });

      $scope.applyRegion = function () { $state.go('.', { region: $scope.region || null }, { notify: false }); load(); };
      $scope.open = function (s) { $state.go('substationDetail', { id: s.id }); };
      $scope.openIeds = function (s, evt) { evt.stopPropagation(); $state.go('ieds', { substationId: s.id }); };

      var unsub = EventBus.subscribe(EventBus.EVENTS.USER_CHANGED, load);
      $scope.$on('$destroy', unsub);
      load();
    }]);
})();
