(function () {
  'use strict';
  // Locale-aware formatting. The operator's locale comes from the session (de-DE engineers see 1.234,5
  // and 02.06.2024, en-GB operators see 1,234.5 and 02/06/2024). Angular's built-in date/number filters
  // are locked to the bundled en-us locale file, hence these wrappers around Intl.
  angular.module('sam')
    .filter('samDate', ['SessionService', function (SessionService) {
      var cache = {};
      function fmt(locale, style) {
        var key = locale + '|' + style;
        if (!cache[key]) {
          var opts = style === 'short' ? { dateStyle: 'short' } : style === 'date' ? { year: 'numeric', month: '2-digit', day: '2-digit' }
            : { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: style === 'seconds' ? '2-digit' : undefined, timeZone: 'UTC' };
          cache[key] = new Intl.DateTimeFormat(locale, opts);
        }
        return cache[key];
      }
      function filter(value, style) {
        if (value === null || value === undefined || value === '') { return '—'; }
        var d = value instanceof Date ? value : new Date(value);
        if (isNaN(d.getTime())) { return String(value); }
        return fmt(SessionService.locale(), style || 'datetime').format(d);
      }
      filter.$stateful = true;
      return filter;
    }])
    .filter('samNumber', ['SessionService', function (SessionService) {
      function filter(value, fractionDigits) {
        if (value === null || value === undefined || value === '') { return '—'; }
        var n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
        if (isNaN(n)) { return String(value); }
        var opts = fractionDigits !== undefined ? { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits } : { maximumFractionDigits: 4 };
        return new Intl.NumberFormat(SessionService.locale(), opts).format(n);
      }
      filter.$stateful = true;
      return filter;
    }])
    .filter('samBytes', function () {
      return function (bytes) {
        if (bytes === null || bytes === undefined) { return '—'; }
        if (bytes < 1024) { return bytes + ' B'; }
        if (bytes < 1048576) { return (bytes / 1024).toFixed(1) + ' KiB'; }
        return (bytes / 1048576).toFixed(2) + ' MiB'; };
    })
    .filter('roleLabel', function () {
      var labels = { VIEWER: 'Viewer', ENGINEER: 'Protection Engineer', PROTECTION_ADMIN: 'Protection Admin', AUDITOR: 'Auditor' };
      return function (role) { return labels[role] || role || 'Anonymous'; };
    })
    .filter('enumLabel', function () {
      return function (value) {
        if (!value) { return '—'; }
        return String(value).toLowerCase().replace(/_/g, ' ').replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); });
      };
    });
})();
