import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  // === Gestión (ya existentes) ===
  {
    path: 'producto',
    loadComponent: () =>
      import('./components/product/producto').then((m) => m.ProductoComponent),
  },
  {
    path: 'cliente',
    loadComponent: () =>
      import('./components/client/cliente').then((m) => m.ClienteComponent),
  },
  {
    path: 'socio',
    loadComponent: () =>
      import('./components/partner/socio').then((m) => m.SocioComponent),
  },
  {
    path: 'venta',
    loadComponent: () =>
      import('./components/sale/venta').then((m) => m.VentaComponent),
  },
  {
    path: 'zona',
    loadComponent: () =>
      import('./components/zone/zona').then((m) => m.ZonaComponent),
  },
  {
    path: 'autoridad',
    loadComponent: () =>
      import('./components/authority/autoridad').then(
        (m) => m.AutoridadComponent
      ),
  },
  {
    path: 'sobornos',
    loadComponent: () =>
      import('./components/bribe/soborno').then((m) => m.SobornoComponent),
  },
  {
    path: 'decision',
    loadComponent: () =>
      import('./components/decision/decision').then((m) => m.DecisionComponent),
  },
  {
    path: 'topic',
    loadComponent: () =>
      import('./components/topic/topic').then((m) => m.TematicaComponent),
  },

  { path: '**', redirectTo: '' },
];
