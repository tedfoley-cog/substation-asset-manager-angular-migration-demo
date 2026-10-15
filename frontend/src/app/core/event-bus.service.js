(function () {
  'use strict';
  // Application-wide event bus on $rootScope. Every screen listens here for cross-cutting updates
  // (user switch, uploads, firmware changes). Listeners must deregister on $destroy or they leak.
  angular.module('sam').factory('EventBus', ['$rootScope', 'SAM_EVENTS', function ($rootScope, SAM_EVENTS) {
    var seq = 0, last = null;
    return {
      EVENTS: SAM_EVENTS,
      publish: function (name, payload) { $rootScope.$broadcast(name, payload); },
      subscribe: function (name, handler) { return $rootScope.$on(name, function (evt, payload) { handler(payload, evt); }); },
      toast: function (level, title, message) {
        // A user switch re-fires every open request; identical failures within 2 s collapse into one toast.
        var key = level + '|' + title + '|' + message, now = Date.now();
        if (last && last.key === key && now - last.at < 2000) { return; }
        last = { key: key, at: now };
        $rootScope.$broadcast(SAM_EVENTS.TOAST, { id: ++seq, level: level, title: title, message: message });
      }
    };
  }]);
})();
