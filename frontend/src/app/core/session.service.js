(function () {
  'use strict';
  // Trusted-header demo authentication: the selected username is sent as X-SAM-User and the service
  // resolves role/permissions. Persisted in localStorage so a reload keeps the operator.
  angular.module('sam').factory('SessionService', ['$window', '$q', 'ApiClient', 'EventBus', function ($window, $q, ApiClient, EventBus) {
    var STORAGE_KEY = 'sam.username';
    var state = { username: $window.localStorage.getItem(STORAGE_KEY) || 'mbrandt', user: null };

    function refresh() {
      return ApiClient.me().then(function (me) {
        state.user = me;
        EventBus.publish(EventBus.EVENTS.USER_CHANGED, me);
        return me;
      });
    }
    return {
      username: function () { return state.username; },
      current: function () { return state.user; },
      locale: function () { return (state.user && state.user.locale) || 'en-GB'; },
      can: function (permission) { return !!state.user && state.user.permissions.indexOf(permission) >= 0; },
      load: refresh,
      switchTo: function (username) {
        state.username = username;
        $window.localStorage.setItem(STORAGE_KEY, username);
        return refresh();
      }
    };
  }]);
})();
