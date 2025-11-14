// Karma configuration file para Angular Testing
// Documentación: https://karma-runner.github.io/latest/config/configuration-file.html

module.exports = function (config) {
  // Sharding configuration for parallel execution
  const shardIndex = process.env.KARMA_SHARD ? parseInt(process.env.KARMA_SHARD) - 1 : 0;
  const totalShards = process.env.KARMA_TOTAL_SHARDS ? parseInt(process.env.KARMA_TOTAL_SHARDS) : 1;

  // Detect CI environment
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // Opciones de Jasmine
        random: false, // Ejecutar tests en orden determinístico
        seed: 42,
        stopSpecOnExpectationFailure: false
      },
      clearContext: false, // mantener visible el output de Jasmine Spec Runner
      // Sharding configuration passed to the browser
      shardIndex: shardIndex,
      totalShards: totalShards
    },
    jasmineHtmlReporter: {
      suppressAll: true // Remover trazas duplicadas
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/The-Garrison-System'),
      subdir: totalShards > 1 ? `shard-${shardIndex + 1}` : '.',
      reporters: [
        { type: 'html' },      // Reporte HTML detallado
        { type: 'text-summary' }, // Resumen en consola
        { type: 'lcovonly' },  // Para Codecov
        { type: 'json' }       // Para análisis adicional
      ],
      check: {
        // Umbrales de cobertura (falla si no se cumple)
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        },
        // Umbrales por archivo (más estrictos para código crítico)
        each: {
          statements: 70,
          branches: 65,
          functions: 70,
          lines: 70
        }
      }
    },
    reporters: ['progress', 'kjhtml', 'coverage'],

    // Configuración de puerto
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,

    // Browsers para testing
    browsers: isCI ? ['ChromeHeadlessCI'] : ['Chrome'],

    // Configuración para CI/CD
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',                    // CRITICAL: Required for Docker/CI environments
          '--disable-gpu',                   // Disable GPU hardware acceleration
          '--disable-dev-shm-usage',         // Overcome limited resource problems
          '--disable-software-rasterizer',   // Disable software rasterizer
          '--disable-extensions',            // Disable extensions
          '--disable-setuid-sandbox',        // Required for running as root in containers
          '--remote-debugging-port=9222',    // Enable remote debugging
          '--headless=new',                  // Use new headless mode (Chrome 109+)
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      },
      ChromeDebug: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9333'
        ]
      }
    },

    // Tiempo de espera
    singleRun: isCI,
    restartOnFileChange: !isCI,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,
    browserNoActivityTimeout: 60000,

    // Configuración de archivos
    files: [
      // Incluir archivos de assets si es necesario
    ],

    // Preprocesadores
    preprocessors: {
      // Los archivos TypeScript son manejados por @angular-devkit/build-angular
    }
  });
};
