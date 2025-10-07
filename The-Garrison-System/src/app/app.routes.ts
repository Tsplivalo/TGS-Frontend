import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  // === Home ===
  { path: '', component: HomeComponent },

  // === Auth ===
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./components/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./components/auth/register/register').then(
        (m) => m.RegisterComponent
      ),
  },

  // === Management (existing) ===
  {
    path: 'producto',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente', 'distribuidor', 'socio'] },
    loadComponent: () =>
      import('./components/product/producto').then((m) => m.ProductoComponent),
  },
  {
    path: 'cliente',
    canActivate: [authGuard, roleGuard],
    data: { roles: [] }, // Admin only
    loadComponent: () =>
      import('./components/client/cliente').then((m) => m.ClienteComponent),
  },
  {
    path: 'socio',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente', 'distribuidor', 'socio'] },
    loadComponent: () =>
      import('./components/partner/socio').then((m) => m.SocioComponent),
  },
  {
    path: 'venta',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['distribuidor'] },
    loadComponent: () =>
      import('./components/sale/venta').then((m) => m.VentaComponent),
  },
  {
    path: 'zona',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente', 'distribuidor', 'socio'] },
    loadComponent: () =>
      import('./components/zone/zona').then((m) => m.ZonaComponent),
  },
  {
    path: 'autoridad',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['distribuidor', 'socio'] },
    loadComponent: () =>
      import('./components/authority/autoridad').then(
        (m) => m.AutoridadComponent
      ),
  },
  {
    path: 'sobornos',
    canActivate: [authGuard, roleGuard],
    data: { roles: [] }, // Admin only
    loadComponent: () =>
      import('./components/bribe/soborno').then((m) => m.SobornoComponent),
  },
  {
    path: 'decision',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['socio'] },
    loadComponent: () =>
      import('./components/decision/decision').then((m) => m.DecisionComponent),
  },
  {
    path: 'topic',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['socio'] },
    loadComponent: () =>
      import('./components/topic/topic').then((m) => m.TematicaComponent),
  },

  // === Static pages (new) ===
  {
    path: 'sobre-nosotros',
    loadComponent: () =>
      import('./components/pages/about/about').then((m) => m.AboutComponent),
  },
  {
    path: 'contactanos',
    loadComponent: () =>
      import('./components/pages/contact/contact').then(
        (m) => m.ContactComponent
      ),
  },
  {
    path: 'faqs',
    loadComponent: () =>
      import('./components/pages/faqs/faqs').then((m) => m.FaqsComponent),
  },

  // === Wildcard ===
  { path: '**', redirectTo: '' },
];
