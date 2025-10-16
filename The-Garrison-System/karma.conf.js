module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    client: {
      clearContext: false // deja visible el resultado de Jasmine en el navegador
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
  dir: 'coverage',
  reporters: [{ type: 'lcov' }, { type: 'text-summary' }],
  check: {
    global: { statements: 60, branches: 30, functions: 45, lines: 60 }
  }
},


    browsers: ['ChromeHeadless'],
    singleRun: true,
    restartOnFileChange: false
  });
};

