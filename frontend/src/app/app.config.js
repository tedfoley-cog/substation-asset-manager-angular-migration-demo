(function () {
  'use strict';
  angular.module('sam')
    .constant('API_BASE', '/api')
    .constant('USER_HEADER', 'X-SAM-User')
    .constant('SAM_EVENTS', {
      USER_CHANGED: 'sam:userChanged',
      API_ERROR: 'sam:apiError',
      API_OK: 'sam:apiOk',
      TOAST: 'sam:toast',
      IED_SELECTED: 'sam:iedSelected',
      SETTINGS_UPLOADED: 'sam:settingsUploaded',
      FIRMWARE_CHANGED: 'sam:firmwareChanged',
      SCL_IMPORTED: 'sam:sclImported'
    })
    .config(['$locationProvider', '$httpProvider', '$compileProvider', function ($locationProvider, $httpProvider, $compileProvider) {
      $locationProvider.html5Mode(false).hashPrefix('!');
      $compileProvider.debugInfoEnabled(true);
      $httpProvider.interceptors.push('userHeaderInterceptor');
      $httpProvider.interceptors.push('apiErrorInterceptor');
    }])
    .factory('userHeaderInterceptor', ['$injector', 'USER_HEADER', function ($injector, USER_HEADER) {
      return {
        request: function (config) {
          if (config.url.indexOf('/api/') === 0) {
            var session = $injector.get('SessionService');
            if (session.username()) { config.headers[USER_HEADER] = session.username(); }
          }
          return config;
        }
      };
    }])
    .factory('apiErrorInterceptor', ['$q', '$rootScope', 'SAM_EVENTS', function ($q, $rootScope, SAM_EVENTS) {
      return {
        response: function (response) {
          if (response.config.url.indexOf('/api/') === 0) { $rootScope.$broadcast(SAM_EVENTS.API_OK); }
          return response;
        },
        responseError: function (rejection) {
          if (rejection.config && rejection.config.url.indexOf('/api/') === 0) {
            var body = rejection.data || {};
            $rootScope.$broadcast(SAM_EVENTS.API_ERROR, {
              status: rejection.status,
              message: body.message || rejection.statusText || 'Request failed',
              details: body.details || [],
              path: body.path || rejection.config.url
            });
          }
          return $q.reject(rejection);
        }
      };
    }]);
})();
