// Angular CLI test runner (ng test). The legacy AngularJS suite keeps using ../../karma.conf.js.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-spec-reporter'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: { jasmine: { random: false }, clearContext: false },
    reporters: ['spec'],
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: { ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox', '--disable-gpu'] } },
    singleRun: true,
    restartOnFileChange: false,
    logLevel: config.LOG_WARN
  });
};
