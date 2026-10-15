// Shared test bootstrap: stop ui-router from navigating to the default state during unit tests.
beforeEach(module('sam', ['$urlRouterProvider', function ($urlRouterProvider) { $urlRouterProvider.deferIntercept(); }]));
