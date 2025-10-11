// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  // Landing
  { path: '', component: HomeComponent },

  // Gestión existente (lazy standalone)
  { path: 'producto',           loadComponent: () => import('./components/product/product').then(m => m.ProductComponent) },
  { path: 'cliente',            loadComponent: () => import('./components/client/client').then(m => m.ClientComponent) },
  { path: 'socio',              loadComponent: () => import('./components/partner/partner').then(m => m.PartnerComponent) },
  { path: 'venta',              loadComponent: () => import('./components/sale/sale').then(m => m.SaleComponent) },
  { path: 'zona',               loadComponent: () => import('./components/zone/zone').then(m => m.ZoneComponent) },
  { path: 'autoridad',          loadComponent: () => import('./components/authority/authority').then(m => m.AuthorityComponent) },
  { path: 'sobornos',           loadComponent: () => import('./components/bribe/bribe').then(m => m.BribeComponent) },
  { path: 'decision',           loadComponent: () => import('./components/decision/decision').then(m => m.DecisionComponent) },
  { path: 'tematica',           loadComponent: () => import('./components/topic/topic').then(m => m.TopicComponent) },
  { path: 'distribuidor',       loadComponent: () => import('./components/distributor/distributor').then(m => m.DistributorComponent) },

  // Nuevos (backend reciente)
  { path: 'consejo-shelby',       loadComponent: () => import('./components/shelby-council/shelby-council').then(m => m.ShelbyCouncilComponent) },
  { path: 'revisiones-mensuales', loadComponent: () => import('./components/monthly-review/monthly-review').then(m => m.MonthlyReviewComponent) },
  { path: 'acuerdos-clandestinos',loadComponent: () => import('./components/clandestine-agreement/clandestine-agreement').then(m => m.ClandestineAgreementComponent) },
  { path: 'solicitudes-rol',      loadComponent: () => import('./components/role-request/role-request').then(m => m.RoleRequestComponent) },
  { path: 'admin',                loadComponent: () => import('./components/admin/admin').then(m => m.AdminComponent) },

  // Cuenta (faltaba esta ruta)
  { path: 'mi-cuenta',            loadComponent: () => import('./components/account/account').then(m => m.AccountComponent) },
  // Alias opcional por si quedó algún link en inglés
  { path: 'my-account',           redirectTo: 'mi-cuenta', pathMatch: 'full' },

  // Auth / públicas
  { path: 'login',             loadComponent: () => import('./components/auth/login/login').then(m => m.LoginComponent) },
  { path: 'register',          loadComponent: () => import('./components/auth/register/register').then(m => m.RegisterComponent) },
  { path: 'tienda',            loadComponent: () => import('./components/store/store').then(m => m.StoreComponent) },
  { path: 'sobre-nosotros',    loadComponent: () => import('./components/pages/about/about').then(m => m.AboutComponent) },
  { path: 'contactanos',       loadComponent: () => import('./components/pages/contact/contact').then(m => m.ContactComponent) },
  { path: 'faqs',              loadComponent: () => import('./components/pages/faqs/faqs').then(m => m.FaqsComponent) },

  // Fallback
  { path: '**', redirectTo: '' },
];
