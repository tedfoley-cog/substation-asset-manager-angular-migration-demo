describe('locale filters', function () {
  var $filter, session;
  beforeEach(module('sam', function ($provide) {
    session = { locale: 'en-GB' };
    $provide.value('SessionService', { locale: function () { return session.locale; } });
  }));
  beforeEach(inject(function (_$filter_) { $filter = _$filter_; }));

  it('samNumber follows the operator locale', function () {
    expect($filter('samNumber')(1234.5)).toBe('1,234.5');
    session.locale = 'de-DE';
    expect($filter('samNumber')(1234.5)).toBe('1.234,5');
    expect($filter('samNumber')('0.30', 2)).toBe('0,30');
  });
  it('samNumber never coerces blanks to zero', function () {
    expect($filter('samNumber')(null)).toBe('—');
    expect($filter('samNumber')('')).toBe('—');
    expect($filter('samNumber')('3-pole')).toBe('3-pole');
  });
  it('samDate renders ISO instants in the operator locale (UTC)', function () {
    expect($filter('samDate')('2024-06-02T19:30:11Z', 'date')).toBe('02/06/2024');
    session.locale = 'de-DE';
    expect($filter('samDate')('2024-06-02T19:30:11Z', 'date')).toBe('02.06.2024');
    expect($filter('samDate')(null)).toBe('—');
  });
  it('samBytes and enumLabel are human readable', function () {
    expect($filter('samBytes')(2411520)).toBe('2.30 MiB');
    expect($filter('enumLabel')('TRANSFORMER_DIFFERENTIAL')).toBe('Transformer Differential');
    expect($filter('roleLabel')('PROTECTION_ADMIN')).toBe('Protection Admin');
  });
});
