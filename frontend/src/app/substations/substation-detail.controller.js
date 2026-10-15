(function () {
  'use strict';
  angular.module('sam').controller('SubstationDetailController', ['$scope', '$stateParams', '$state', '$q', 'ApiClient',
    function ($scope, $stateParams, $state, $q, ApiClient) {
      $scope.loading = true;
      $scope.substation = null;
      $scope.bays = [];
      $scope.iedsByBay = {};

      $q.all([ApiClient.substation($stateParams.id), ApiClient.bays($stateParams.id), ApiClient.ieds({ substationId: $stateParams.id })])
        .then(function (results) {
          $scope.substation = results[0];
          $scope.bays = results[1];
          results[2].forEach(function (ied) { ($scope.iedsByBay[ied.bayId] = $scope.iedsByBay[ied.bayId] || []).push(ied); });
        })
        .catch(function () { $scope.notFound = true; })
        .finally(function () { $scope.loading = false; });

      $scope.openIed = function (ied) { $state.go('iedDetail', { id: ied.id }); };
    }]);
})();
