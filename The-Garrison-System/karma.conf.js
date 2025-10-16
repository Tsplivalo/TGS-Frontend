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
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },          // reporte visual (coverage/index.html)
        { type: 'text-summary' },  // resumen en consola
        { type: 'json' },          // detalle por archivo
        { type: 'json-summary' }   // <-- necesario para check-coverage.cjs
      ],
      fixWebpackSourcePaths: true
    },

    browsers: ['ChromeHeadless'],
    singleRun: true,
    restartOnFileChange: false
  });
};

