// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

// TranslateModule
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

// ✅ TU LOADER PERSONALIZADO (en lugar del de @ngx-translate/http-loader)
import { HttpTranslateLoader } from '../app/i18n/translate-loader';

// Factory usando TU loader
export function createTranslateLoader(http: HttpClient) {
  return new HttpTranslateLoader(http);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    // ⚠️ IMPORTANTE: HttpClient ANTES de TranslateModule
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    
    // ✅ TranslateModule con TU loader personalizado
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        }
      })
    )
  ]
};