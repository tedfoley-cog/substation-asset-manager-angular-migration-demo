(function () {
  'use strict';
  // sam-sticky-header: keeps a wide table's <thead> visible while the operator scrolls long IED/audit lists.
  // Written in 2017 before position:sticky was dependable in the control-room browsers; it clones the
  // header row into a fixed-position shadow table and re-syncs column widths on scroll/resize.
  angular.module('sam').directive('samStickyHeader', ['$window', '$timeout', function ($window, $timeout) {
    return {
      restrict: 'A',
      link: function (scope, element) {
        var table = element[0];
        var shadow = angular.element('<table class="sticky-shadow" aria-hidden="true"></table>');
        var win = angular.element($window);
        var visible = false;

        function syncWidths() {
          var liveCells = table.querySelectorAll('thead th');
          var shadowCells = shadow[0].querySelectorAll('th');
          for (var i = 0; i < liveCells.length && i < shadowCells.length; i++) {
            shadowCells[i].style.width = liveCells[i].getBoundingClientRect().width + 'px';
          }
          shadow[0].style.width = table.getBoundingClientRect().width + 'px';
          shadow[0].style.left = table.getBoundingClientRect().left + 'px';
        }
        function rebuild() {
          var thead = table.querySelector('thead');
          if (!thead) { return; }
          shadow.empty();
          shadow.append(angular.element(thead.cloneNode(true)));
          syncWidths();
        }
        function onScroll() {
          var rect = table.getBoundingClientRect();
          var shouldShow = rect.top < 56 && rect.bottom > 120;
          if (shouldShow !== visible) {
            visible = shouldShow;
            shadow.toggleClass('sticky-shadow--visible', visible);
            table.classList.toggle('has-sticky-shadow', visible);
          }
          if (visible) { syncWidths(); }
        }

        element.after(shadow);
        $timeout(rebuild, 0, false);
        scope.$watch(function () { return table.querySelectorAll('thead th').length; }, rebuild);
        win.on('scroll', onScroll);
        win.on('resize', syncWidths);
        scope.$on('$destroy', function () {
          win.off('scroll', onScroll);
          win.off('resize', syncWidths);
          shadow.remove();
        });
      }
    };
  }]);
})();
