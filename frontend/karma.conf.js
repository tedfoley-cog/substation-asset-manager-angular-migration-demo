module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-animate/angular-animate.js',
      'node_modules/angular-sanitize/angular-sanitize.js',
      'node_modules/@uirouter/angularjs/release/angular-ui-router.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'src/ng/settings-compare.logic.js',
      'src/app/app.module.js',
      'src/app/**/*.js',
      'test/unit/_helpers.js',
      'test/unit/**/*.spec.js'
    ],
    reporters: ['spec'],
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: { ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox', '--disable-gpu'] } },
    singleRun: true,
    logLevel: config.LOG_WARN
  });
};
