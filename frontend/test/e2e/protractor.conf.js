// Legacy — not executed. See README.md in this directory.
exports.config = {
  directConnect: true,
  baseUrl: 'http://localhost:3000',
  framework: 'jasmine2',
  specs: ['specs/*.spec.js'],
  capabilities: { browserName: 'chrome', chromeOptions: { args: ['--headless', '--window-size=1400,900'] } },
  rootElement: 'body',
  useAllAngular2AppRoots: false,
  jasmineNodeOpts: { defaultTimeoutInterval: 60000 },
  onPrepare: function () { browser.manage().window().setSize(1400, 900); }
};
