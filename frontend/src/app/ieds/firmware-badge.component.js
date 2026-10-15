(function () {
  'use strict';
  // Newer-style component (2019). Shows version with approval / end-of-life markers.
  angular.module('sam').component('firmwareBadge', {
    bindings: { firmware: '<' },
    template:
      '<span class="fw" ng-if="$ctrl.firmware" title="{{$ctrl.title()}}" data-test="firmware-badge">' +
      '  <span class="fw-dot" ng-class="$ctrl.state()"></span>' +
      '  <span ng-bind="$ctrl.firmware.version"></span>' +
      '  <span class="fw-flag eol" ng-if="$ctrl.firmware.endOfLife">EOL</span>' +
      '  <span class="fw-flag unapproved" ng-if="!$ctrl.firmware.endOfLife && !$ctrl.firmware.approved">unapproved</span>' +
      '</span><span class="muted" ng-if="!$ctrl.firmware">—</span>',
    controller: function () {
      var $ctrl = this;
      $ctrl.state = function () { return $ctrl.firmware.endOfLife ? 'eol' : $ctrl.firmware.approved ? 'approved' : 'unapproved'; };
      $ctrl.title = function () {
        var f = $ctrl.firmware;
        return f.platform + ' ' + f.version + (f.approved ? ' — approved' : ' — not approved for service') + (f.endOfLife ? ' — END OF LIFE' : '') + (f.releaseNotes ? '\n' + f.releaseNotes : '');
      };
    }
  });
})();
