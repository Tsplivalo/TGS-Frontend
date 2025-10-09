import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  // === Home ===
  { path: '', component: HomeComponent },

  // === Gestión ===
  {
    path: 'producto',
    loadComponent: () =>
      import('./components/product/product').then((m) => m.ProductComponent),
  },
  {
    path: 'cliente',
    loadComponent: () =>
      import('./components/client/client').then((m) => m.ClientComponent),
  },
  {
    path: 'socio',
    loadComponent: () =>
      import('./components/partner/partner').then((m) => m.PartnerComponent),
  },
  {
    path: 'venta',
    loadComponent: () =>
      import('./components/sale/sale').then((m) => m.SaleComponent),
  },
  {
    path: 'zona',
    loadComponent: () =>
      import('./components/zone/zone').then((m) => m.ZoneComponent),
  },
  {
    path: 'autoridad',
    loadComponent: () =>
      import('./components/authority/authority').then(
        (m) => m.AuthorityComponent
      ),
  },
  {
    path: 'sobornos',
    loadComponent: () =>
      import('./components/bribe/bribe').then((m) => m.BribeComponent),
  },
  {
    path: 'decision',
    loadComponent: () =>
      import('./components/decision/decision').then((m) => m.DecisionComponent),
  },
  {
    path: 'tematica',
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
