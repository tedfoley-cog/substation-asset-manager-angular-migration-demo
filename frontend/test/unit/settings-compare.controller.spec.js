describe('SettingsCompareController', function () {
  var $controller, $rootScope, $httpBackend, scope;
  var history = [
    { id: 12, iedId: 7, versionNo: 3, status: 'ACTIVE', uploadedAt: '2024-06-10T09:00:00Z', uploadedBy: 'mbrandt' },
    { id: 11, iedId: 7, versionNo: 2, status: 'SUPERSEDED', uploadedAt: '2023-02-01T09:00:00Z', uploadedBy: 'aokafor' }
  ];
  var v2 = { id: 11, iedId: 7, iedName: 'NTH01_T1_87T', versionNo: 2, values: [
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '87T Pickup', value: '0.30', unit: 'pu', minValue: '0.10', maxValue: '1.00' },
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '87T Slope 1', value: '25', unit: '%', minValue: '15', maxValue: '50' },
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '5th Harmonic Block', value: '35', unit: '%', minValue: '10', maxValue: '50' },
    { settingGroup: 'Group 1', lnClass: 'PTRC', name: 'Trip Mode', value: '3-pole', unit: null, minValue: null, maxValue: null }
  ] };
  var v3 = { id: 12, iedId: 7, iedName: 'NTH01_T1_87T', versionNo: 3, values: [
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '87T Pickup', value: '0.3000', unit: 'pu', minValue: '0.10', maxValue: '1.00' },
    { settingGroup: 'Group 1', lnClass: 'PDIF', name: '87T Slope 1', value: '55', unit: '%', minValue: '15', maxValue: '50' },
    { settingGroup: 'Group 1', lnClass: 'PTRC', name: 'Trip Mode', value: '1-pole', unit: null, minValue: null, maxValue: null },
    { settingGroup: 'Group 2', lnClass: 'PTOC', name: '51P Pickup', value: '1.20', unit: 'xIn', minValue: '0.50', maxValue: '4.00' }
  ] };

  beforeEach(module('sam'));
  beforeEach(inject(function (_$controller_, _$rootScope_, _$httpBackend_) {
    $controller = _$controller_; $rootScope = _$rootScope_; $httpBackend = _$httpBackend_;
    $httpBackend.whenGET(/^app\/.*\.html$/).respond('');
    $httpBackend.whenGET('/api/me').respond({ username: 'mbrandt', locale: 'de-DE', role: 'ENGINEER', permissions: [] });
    $httpBackend.whenGET('/api/users').respond([]);
    $httpBackend.whenGET('/api/ieds/7/settings').respond(history);
    $httpBackend.whenGET('/api/settings/11').respond(v2);
    $httpBackend.whenGET('/api/settings/12').respond(v3);
  }));

  function build(params) {
    scope = $rootScope.$new();
    $controller('SettingsCompareController', { $scope: scope, $stateParams: angular.extend({ id: '7' }, params || {}), $state: { go: angular.noop } });
    $httpBackend.flush();
    return scope;
  }

  it('defaults to active version vs the previous one', function () {
    build();
    expect(scope.left.versionNo).toBe(2);
    expect(scope.right.versionNo).toBe(3);
    expect(scope.selection).toEqual({ left: 11, right: 12 });
  });

  it('classifies rows and tolerates export rounding', function () {
    build({ left: '11', right: '12' });
    var byName = {};
    scope.rows.forEach(function (r) { byName[r.name] = r; });
    expect(byName['87T Pickup'].kind).toBe('unchanged');
    expect(byName['87T Slope 1'].kind).toBe('changed');
    expect(byName['87T Slope 1'].violation).toBe('exceeds maximum 50');
    expect(byName['5th Harmonic Block'].kind).toBe('removed');
    expect(byName['51P Pickup'].kind).toBe('added');
    expect(byName['Trip Mode'].kind).toBe('changed');
    expect(scope.summary).toEqual({ changed: 2, added: 1, removed: 1, violations: 1, unchanged: 1 });
  });

  it('orders violations first, then protection-relevant changes', function () {
    build({ left: '11', right: '12' });
    expect(scope.rows[0].name).toBe('87T Slope 1');
    expect(scope.rows[0].severity).toBe(3);
    expect(scope.rows[1].severity).toBe(2);
    expect(scope.rows[scope.rows.length - 1].kind).toBe('unchanged');
  });

  it('hides unchanged rows by default and supports group filtering', function () {
    build({ left: '11', right: '12' });
    expect(scope.visibleRows().length).toBe(4);
    scope.showUnchanged = true;
    expect(scope.visibleRows().length).toBe(5);
    scope.groupFilter = 'Group 2';
    expect(scope.visibleRows().map(function (r) { return r.name; })).toEqual(['51P Pickup']);
  });

  it('computes a signed percentage delta', function () {
    build({ left: '11', right: '12' });
    var slope = scope.rows.filter(function (r) { return r.name === '87T Slope 1'; })[0];
    expect(slope.delta).toMatch(/^\+120/);
  });
});
