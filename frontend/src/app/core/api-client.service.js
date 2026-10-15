(function () {
  'use strict';
  angular.module('sam').factory('ApiClient', ['$http', 'API_BASE', function ($http, API_BASE) {
    function get(path, params) { return $http.get(API_BASE + path, { params: params }).then(unwrap); }
    function post(path, body, config) { return $http.post(API_BASE + path, body, config).then(unwrap); }
    function put(path, body) { return $http.put(API_BASE + path, body).then(unwrap); }
    function unwrap(res) { return res.data; }
    function clean(params) {
      var out = {};
      angular.forEach(params, function (v, k) { if (v !== null && v !== undefined && v !== '') { out[k] = v; } });
      return out;
    }
    return {
      me: function () { return get('/me'); },
      users: function () { return get('/users'); },
      substations: function (region) { return get('/substations', clean({ region: region })); },
      substation: function (id) { return get('/substations/' + id); },
      bays: function (substationId) { return get('/substations/' + substationId + '/bays'); },
      ieds: function (filters) { return get('/ieds', clean(filters)); },
      ied: function (id) { return get('/ieds/' + id); },
      firmware: function (platform) { return get('/firmware', clean({ platform: platform })); },
      assignFirmware: function (iedId, firmwareVersionId) { return put('/ieds/' + iedId + '/firmware', { firmwareVersionId: firmwareVersionId }); },
      changeStatus: function (iedId, status, reason) { return put('/ieds/' + iedId + '/status', { status: status, reason: reason }); },
      settingsHistory: function (iedId) { return get('/ieds/' + iedId + '/settings'); },
      settingsFile: function (fileId) { return get('/settings/' + fileId); },
      uploadSettings: function (iedId, payload) { return post('/ieds/' + iedId + '/settings', payload); },
      sclImports: function () { return get('/scl/imports'); },
      sclImport: function (id) { return get('/scl/imports/' + id); },
      importScl: function (file) {
        var form = new FormData();
        form.append('file', file, file.name);
        return post('/scl/imports', form, { headers: { 'Content-Type': undefined }, transformRequest: angular.identity });
      },
      records: function (filters) { return get('/records', clean(filters)); },
      record: function (id) { return get('/records/' + id); },
      downloadRecord: function (id) { return $http.post(API_BASE + '/records/' + id + '/download', null, { responseType: 'text' }); },
      audit: function (filters) { return get('/audit', clean(filters)); },
      auditActions: function () { return get('/audit/actions'); }
    };
  }]);
})();
