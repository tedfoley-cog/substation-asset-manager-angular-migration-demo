describe('samStickyHeader directive', function () {
  var $compile, $rootScope, $timeout;
  beforeEach(module('sam'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_) { $compile = _$compile_; $rootScope = _$rootScope_; $timeout = _$timeout_; }));

  it('clones the header into a shadow table and removes it on destroy', function () {
    var scope = $rootScope.$new();
    var host = angular.element('<div><table sam-sticky-header><thead><tr><th>IED</th><th>Status</th></tr></thead><tbody></tbody></table></div>');
    angular.element(document.body).append(host);
    $compile(host)(scope);
    scope.$digest();
    $timeout.flush();
    var shadow = host[0].querySelector('table.sticky-shadow');
    expect(shadow).not.toBeNull();
    expect(shadow.querySelectorAll('th').length).toBe(2);
    expect(shadow.textContent).toContain('Status');
    scope.$destroy();
    expect(host[0].querySelector('table.sticky-shadow')).toBeNull();
    host.remove();
  });
});
