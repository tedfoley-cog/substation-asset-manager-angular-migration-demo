// Legacy Protractor scenario (2019). Not executed — see ../README.md.
describe('Settings comparison', function () {
  it('shows a diff between two versions', function () {
    browser.get('/#!/ieds/1/settings/compare');
    expect(element(by.binding('summary.changed')).getText()).not.toBe('');
  });
});
