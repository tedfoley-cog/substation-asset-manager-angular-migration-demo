(function () {
  'use strict';
  // Substation Asset Manager — AngularJS 1.8 client.
  // History: started 2016 on 1.5, moved to components where new screens were written; older screens
  // (substations, IED detail, settings comparison) still use $scope controllers and the $rootScope bus.
  angular.module('sam', ['ui.router', 'ngSanitize', 'ngAnimate']);
})();
