(function () {
  'use strict';
  angular.module('sam').controller('AuditController', ['$scope', '$state', '$stateParams', 'ApiClient', 'SessionService', 'EventBus',
    function ($scope, $state, $stateParams, ApiClient, SessionService, EventBus) {
      $scope.filters = { actor: $stateParams.actor || '', action: $stateParams.action || '', entityType: $stateParams.entityType || '' };
      $scope.events = [];
      $scope.actions = [];
      $scope.users = [];
      $scope.entityTypes = ['IED', 'SETTINGS_FILE', 'SCL_IMPORT', 'DISTURBANCE_RECORD', 'USER', 'SESSION'];
      $scope.forbidden = false;
      $scope.loading = true;
      $scope.expanded = null;

      ApiClient.users().then(function (u) { $scope.users = u; });

      function load() {
        $scope.loading = true;
        $scope.forbidden = false;
        ApiClient.auditActions().then(function (a) { $scope.actions = a; }).catch(angular.noop);
        ApiClient.audit($scope.filters).then(function (list) { $scope.events = list; })
          .catch(function (rej) { $scope.events = []; $scope.forbidden = rej.status === 403; })
          .finally(function () { $scope.loading = false; });
        $state.go('.', $scope.filters, { notify: false });
      }
      $scope.apply = load;
      $scope.reset = function () { $scope.filters = { actor: '', action: '', entityType: '' }; load(); };
      $scope.toggle = function (e) { $scope.expanded = $scope.expanded === e.id ? null : e.id; };
      $scope.countOutcome = function (o) { return $scope.events.filter(function (e) { return e.outcome === o; }).length; };

      var unsub = EventBus.subscribe(EventBus.EVENTS.USER_CHANGED, load);
      $scope.$on('$destroy', unsub);
      load();
    }]);
})();
