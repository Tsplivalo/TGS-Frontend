import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Fuerza withCredentials=true globalmente (cookies hacia /api)
  const cloned = req.clone({ withCredentials: true });
  return next(cloned);
};
