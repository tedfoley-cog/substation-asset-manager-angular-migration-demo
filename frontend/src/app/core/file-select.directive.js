(function () {
  'use strict';
  // sam-file-select="onFiles(files)" — bridges the native <input type=file> change event into the scope.
  angular.module('sam').directive('samFileSelect', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var handler = $parse(attrs.samFileSelect);
        element.on('change', function (evt) {
          var files = Array.prototype.slice.call(evt.target.files || []);
          scope.$apply(function () { handler(scope, { files: files }); });
          element.val(null);
        });
      }
    };
  }]);
})();
