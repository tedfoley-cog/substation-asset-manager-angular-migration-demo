(function () {
  'use strict';
  angular.module('sam').config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/substations');

    $stateProvider
      .state('substations', { url: '/substations?region', templateUrl: 'app/substations/substations.html', controller: 'SubstationsController' })
      .state('substationDetail', { url: '/substations/:id', templateUrl: 'app/substations/substation-detail.html', controller: 'SubstationDetailController' })
      .state('ieds', { url: '/ieds?substationId&deviceType&status&q&sort', templateUrl: 'app/ieds/ied-list.html', controller: 'IedListController',
        params: { sort: { value: 'name', squash: true } } })
      .state('iedDetail', { url: '/ieds/:id?tab', templateUrl: 'app/ieds/ied-detail.html', controller: 'IedDetailController',
        params: { tab: { value: 'overview', squash: true } } })
      .state('settingsCompare', { url: '/ieds/:id/settings/compare?left&right', templateUrl: 'app/settings/settings-compare.html', controller: 'SettingsCompareController' })
      .state('sclImport', { url: '/scl-import?importId', templateUrl: 'app/scl/scl-import.html', controller: 'SclImportController' })
      .state('records', { url: '/records?substationId&iedId&downloaded&from&to', templateUrl: 'app/records/records.html', controller: 'RecordsController' })
      .state('audit', { url: '/audit?actor&action&entityType', templateUrl: 'app/audit/audit.html', controller: 'AuditController' });
  }]);
})();
