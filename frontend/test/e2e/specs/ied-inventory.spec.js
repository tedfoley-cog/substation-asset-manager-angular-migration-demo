// Legacy Protractor scenario (2018). Not executed — see ../README.md.
describe('IED inventory', function () {
  beforeEach(function () { browser.get('/#!/ieds'); });

  it('filters by substation using the legacy select', function () {
    element(by.model('filters.substationId')).sendKeys('NTH-01');
    expect(element.all(by.repeater('ied in ieds')).count()).toBeGreaterThan(0);
  });

  it('opens the detail page', function () {
    element.all(by.repeater('ied in ieds')).first().click();
    expect(browser.getCurrentUrl()).toMatch(/#!\/ieds\/\d+/);
  });
});
