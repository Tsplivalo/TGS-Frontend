import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig }      from '@angular/core';
import { provideRouter }          from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/components/auth/auth.interceptor';
import { AppComponent }           from './app/app';
import { appRoutes }              from './app/app.routes';

const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ]
};

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
