import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';
import { authErrorInterceptor } from './interceptors/auth-error.interceptor';
import { AuthService } from './services/auth/auth';

import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { HttpTranslateLoader } from './i18n/translate-loader';

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
  return () => {
    const lang = detectBrowserLang();
    ts.setDefaultLang('en');
    ts.use(lang);
  };
}

// Hidrata sesión desde cookie en el bootstrap (llama /api/users/me)
function initAuthFactory() {
  return () => {
    const auth = inject(AuthService);
    auth.fetchMe();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    // HTTP + Interceptores (credenciales primero, errores después)
    provideHttpClient(withInterceptors([credentialsInterceptor, authErrorInterceptor])),

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

    // Inicializador de idioma
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initI18nFactory,
      deps: [TranslateService],
    },
    // Inicializador de sesión (me)
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initAuthFactory,
      deps: [],
    },
  ],
};
