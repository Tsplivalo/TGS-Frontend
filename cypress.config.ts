import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // URL base de la aplicación
    baseUrl: 'http://localhost:4200',

    // URL del backend API
    env: {
      apiUrl: 'http://localhost:3000',
      apiPath: '/api'
    },

    // Configuración de viewports
    viewportWidth: 1280,
    viewportHeight: 720,

    // Configuración de videos y screenshots
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    screenshotOnRunFailure: true,

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,

    // Retry en caso de fallos (útil para tests flaky)
    retries: {
      runMode: 2, // CI/CD
      openMode: 0  // Desarrollo local
    },

    // Configuración de especificaciones
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',

    // Configuración de browser
    chromeWebSecurity: false, // Permitir CORS en desarrollo

    // Configuración de Node events
    setupNodeEvents(on, config) {
      // Aquí puedes agregar plugins y listeners de eventos

      // Plugin para tasks personalizadas
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        }
      });

      // Configuración de variables de entorno dinámicas
      config.env.backendReady = false;

      return config;
    },

    // Opciones experimentales
    experimentalStudio: true, // Cypress Studio para grabar tests
    experimentalWebKitSupport: false,

    // Configuración de grabación (Cypress Cloud)
    // projectId: 'your-project-id', // Descomenta si usas Cypress Cloud

    // Exclusiones
    excludeSpecPattern: [
      '**/__snapshots__/*',
      '**/__image_snapshots__/*'
    ]
  },

  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack'
    },
    specPattern: '**/*.cy.ts'
  }
});
