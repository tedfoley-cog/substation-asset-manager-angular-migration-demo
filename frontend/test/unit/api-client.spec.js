describe('ApiClient + interceptors', function () {
  var ApiClient, $httpBackend, $rootScope, SAM_EVENTS;
  beforeEach(module('sam', function ($provide) {
    $provide.value('SessionService', { username: function () { return 'rvasquez'; }, locale: function () { return 'en-GB'; } });
  }));
  beforeEach(inject(function (_ApiClient_, _$httpBackend_, _$rootScope_, _SAM_EVENTS_) { ApiClient = _ApiClient_; $httpBackend = _$httpBackend_; $rootScope = _$rootScope_; SAM_EVENTS = _SAM_EVENTS_; }));
  afterEach(function () { $httpBackend.verifyNoOutstandingExpectation(); });

  it('adds the trusted user header and strips empty filters', function () {
    $httpBackend.expectGET('/api/ieds?deviceType=LINE_DISTANCE', function (headers) { return headers['X-SAM-User'] === 'rvasquez'; }).respond([]);
    ApiClient.ieds({ deviceType: 'LINE_DISTANCE', status: '', q: null });
    $httpBackend.flush();
  });
  it('broadcasts the API error envelope on failure', function () {
    var err;
    $rootScope.$on(SAM_EVENTS.API_ERROR, function (e, p) { err = p; });
    $httpBackend.expectPUT('/api/ieds/1/firmware').respond(403, { status: 403, message: 'Role ENGINEER may not assign firmware', details: [], path: '/api/ieds/1/firmware' });
    ApiClient.assignFirmware(1, 2).catch(angular.noop);
    $httpBackend.flush();
    expect(err.status).toBe(403);
    expect(err.message).toBe('Role ENGINEER may not assign firmware');
  });
  it('posts enforce / unenforce for a settings file and reads the enforced set', function () {
    $httpBackend.expectPOST('/api/settings/5/enforce').respond({ id: 5, status: 'ACTIVE' });
    $httpBackend.expectPOST('/api/settings/5/unenforce').respond({ id: 5, status: 'SUPERSEDED' });
    $httpBackend.expectGET('/api/ieds/3/settings/enforced').respond([{ id: 6, versionNo: 2, status: 'ACTIVE' }]);
    var out = [];
    ApiClient.enforceSettings(5).then(function (f) { out.push(f.status); });
    ApiClient.unenforceSettings(5).then(function (f) { out.push(f.status); });
    ApiClient.enforcedSettings(3).then(function (l) { out.push(l.length); });
    $httpBackend.flush();
    expect(out).toEqual(['ACTIVE', 'SUPERSEDED', 1]);
  });
});
