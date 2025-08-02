// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig }      from '@angular/core';
import { provideRouter }          from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent }           from './app/app';
import { appRoutes }              from './app/app.routes';

const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
  ]
};

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
