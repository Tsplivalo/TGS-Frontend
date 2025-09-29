// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { AuthService } from './app/services/auth/auth';

bootstrapApplication(AppComponent, appConfig).then(ref => {
  const injector = ref.injector;
  const auth = injector.get(AuthService);
  auth.fetchMe(); // intenta hidratar sesión desde cookie
});
