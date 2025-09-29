import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { tokenInterceptor } from './services/auth/token.interceptor';

export const appConfig = {
  providers: [
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideRouter(appRoutes),
  ],
};
