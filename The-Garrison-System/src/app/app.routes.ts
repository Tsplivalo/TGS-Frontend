import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './components/layout/public-layout/public-layout';
import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';
import { authGuard } from './services/auth/auth.guard';
import { ZonaComponent } from './components/zona/zona';
import { ClienteComponent } from './components/cliente/cliente';

export const appRoutes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  { path: 'zonas', component: ZonaComponent, canActivate: [authGuard] },
  { path: 'clientes', component: ClienteComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];