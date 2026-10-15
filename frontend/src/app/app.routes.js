(function () {
  'use strict';
  angular.module('sam').config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/substations');

    $stateProvider
      .state('substations', { url: '/substations?region', params: { region: { dynamic: true } }, templateUrl: 'app/substations/substations.html', controller: 'SubstationsController' })
      .state('substationDetail', { url: '/substations/:id', templateUrl: 'app/substations/substation-detail.html', controller: 'SubstationDetailController' })
      .state('ieds', { url: '/ieds?substationId&deviceType&status&q&sort', templateUrl: 'app/ieds/ied-list.html', controller: 'IedListController',
        params: { sort: { value: 'name', squash: true, dynamic: true }, substationId: { dynamic: true }, deviceType: { dynamic: true }, status: { dynamic: true }, q: { dynamic: true } } })
      .state('iedDetail', { url: '/ieds/:id?tab', templateUrl: 'app/ieds/ied-detail.html', controller: 'IedDetailController',
        params: { tab: { value: 'overview', squash: true, dynamic: true } } })
      .state('settingsCompare', { url: '/ieds/:id/settings/compare?left&right', params: { left: { dynamic: true }, right: { dynamic: true } }, templateUrl: 'app/settings/settings-compare.html', controller: 'SettingsCompareController' })
      .state('sclImport', { url: '/scl-import?importId', params: { importId: { dynamic: true } }, templateUrl: 'app/scl/scl-import.html', controller: 'SclImportController' })
      .state('records', { url: '/records?substationId&iedId&downloaded&from&to', params: { substationId: { dynamic: true }, iedId: { dynamic: true }, downloaded: { dynamic: true }, from: { dynamic: true }, to: { dynamic: true } }, templateUrl: 'app/records/records.html', controller: 'RecordsController' })
      .state('audit', { url: '/audit?actor&action&entityType', params: { actor: { dynamic: true }, action: { dynamic: true }, entityType: { dynamic: true } }, templateUrl: 'app/audit/audit.html', controller: 'AuditController' });
  }]);
})();
