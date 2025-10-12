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
      import('./components/product/product').then((m) => m.ProductComponent),
  },
  {
    path: 'cliente',
    canActivate: [authGuard, roleGuard],
    data: { roles: [] }, // Admin only
    loadComponent: () =>
      import('./components/client/client').then((m) => m.ClientComponent),
  },
  {
    path: 'socio',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente', 'distribuidor', 'socio'] },
    loadComponent: () =>
      import('./components/partner/partner').then((m) => m.PartnerComponent),
  },
  {
    path: 'venta',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['distribuidor'] },
    loadComponent: () =>
      import('./components/sale/sale').then((m) => m.SaleComponent),
  },
  {
    path: 'zona',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente', 'distribuidor', 'socio'] },
    loadComponent: () =>
      import('./components/zone/zone').then((m) => m.ZoneComponent),
  },
  {
    path: 'autoridad',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['distribuidor', 'socio'] },
    loadComponent: () =>
      import('./components/authority/authority').then(
        (m) => m.AuthorityComponent
      ),
  },
  {
    path: 'sobornos',
    canActivate: [authGuard, roleGuard],
    data: { roles: [] }, // Admin only
    loadComponent: () =>
      import('./components/bribe/bribe').then((m) => m.BribeComponent),
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
      import('./components/topic/topic').then((m) => m.TopicComponent),
  },

  // === Distribuidor ===
  {
    path: 'distribuidor',
    loadComponent: () =>
      import('./components/distributor/distributor').then(
        (m) => m.DistributorComponent
      ),
  },

  // === Cliente: Tienda + Mi Cuenta ===
  {
    path: 'tienda',
    loadComponent: () =>
      import('./components/store/store.js').then((m) => m.StoreComponent),
  },
  {
    path: 'mi-cuenta',
    loadComponent: () =>
      import('./components/account/account.js').then((m) => m.AccountComponent),
  },

  // === Páginas estáticas ===
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
