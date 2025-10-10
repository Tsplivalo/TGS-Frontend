import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';
import { AuthService } from './services/auth/auth';

import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { HttpTranslateLoader } from './i18n/translate-loader';

/**
 * appConfig
 *
 * - Router + HttpClient con interceptor de credenciales
 * - ngx-translate con loader HTTP
 * - APP_INITIALIZER para elegir idioma por navegador (en/ES) en arranque
 *
 * Notas:
 * • Usamos APP_INITIALIZER (token oficial) en lugar de un string arbitrario.
 * • Guardamos acceso a `navigator` para SSR/entornos sin DOM.
 */

export function translateLoaderFactory(http: HttpClient): TranslateLoader {
  return new HttpTranslateLoader(http);
}

// Detecta lenguaje del navegador de forma segura (fallback 'en')
function detectBrowserLang(): 'en' | 'es' {
  if (typeof navigator === 'undefined') return 'en';
  const base = (navigator.language || 'en').split('-')[0];
  return (base === 'es' || base === 'en') ? base : 'en';
}

function initI18nFactory(ts: TranslateService) {
  // Debe devolver una función: Angular la ejecuta en bootstrap y espera su finalización
  return () => {
    const lang = detectBrowserLang();
    ts.setDefaultLang('en');
    ts.use(lang);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Routing
    provideRouter(routes),

    // HTTP + Interceptor de credenciales (cookies, etc.)
    provideHttpClient(withInterceptors([credentialsInterceptor])),

    // Servicios singleton
    AuthService,

    // i18n (ngx-translate) con loader HTTP
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: translateLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),

    // Inicializador de idioma al arrancar la app
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initI18nFactory,
      deps: [TranslateService],
    },
  ],
};
