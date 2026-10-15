(function () {
  'use strict';
  angular.module('sam').controller('ShellController', ['$scope', '$state', '$timeout', 'ApiClient', 'SessionService', 'EventBus', 'SAM_EVENTS',
    function ($scope, $state, $timeout, ApiClient, SessionService, EventBus, SAM_EVENTS) {
      $scope.users = [];
      $scope.toasts = [];
      $scope.drawerOpen = false;
      $scope.session = { username: SessionService.username() };
      $scope.currentUser = null;
      $scope.apiStatus = { text: 'connecting…', cls: 'status-unknown' };

      $scope.can = function (permission) { return SessionService.can(permission); };

      $scope.switchUser = function (username) {
        SessionService.switchTo(username).then(function () {
          EventBus.toast('info', 'Operator changed', 'Now acting as ' + $scope.currentUser.displayName + ' (' + $scope.currentUser.role + ')');
          $state.reload();
        });
      };

      $scope.dismissToast = function (toast) {
        var i = $scope.toasts.indexOf(toast);
        if (i >= 0) { $scope.toasts.splice(i, 1); }
      };

      $scope.$on(SAM_EVENTS.USER_CHANGED, function (evt, user) {
        $scope.currentUser = user;
        $scope.session.username = SessionService.username();
      });
      $scope.$on(SAM_EVENTS.TOAST, function (evt, toast) {
        $scope.toasts.push(toast);
        $timeout(function () { $scope.dismissToast(toast); }, toast.level === 'error' ? 9000 : 4500);
      });
      $scope.$on(SAM_EVENTS.API_ERROR, function (evt, err) {
        $scope.apiStatus = err.status === -1 || err.status === 502 ? { text: 'unreachable', cls: 'status-down' } : { text: 'online', cls: 'status-up' };
        if (err.status === 403) { EventBus.toast('error', 'Not permitted', err.message); }
        else if (err.status >= 500 || err.status <= 0) { EventBus.toast('error', 'Service error', err.message); }
      });
      $scope.$on(SAM_EVENTS.API_OK, function () { $scope.apiStatus = { text: 'online', cls: 'status-up' }; });
      $scope.$on('$stateChangeError', function (evt, to, toParams, from, fromParams, error) {
        EventBus.toast('error', 'Navigation failed', (error && error.message) || String(error));
      });

      ApiClient.users().then(function (users) { $scope.users = users; });
      SessionService.load();
    }]);
})();
