import { Routes } from '@angular/router';
import { canMatchAuth, canActivateAuth } from './guards/auth.guard';
import { canMatchRole, canActivateRole } from './guards/role.guard';

export const routes: Routes = [
  // públicas
  { path: '', pathMatch: 'full', loadComponent: () => import('./components/home/home').then(m => m.HomeComponent) },
  { path: 'sobre-nosotros', loadComponent: () => import('./components/pages/about/about').then(m => m.AboutComponent) },
  { path: 'faqs', loadComponent: () => import('./components/pages/faqs/faqs').then(m => m.FaqsComponent) },
  { path: 'contactanos', loadComponent: () => import('./components/pages/contact/contact').then(m => m.ContactComponent) },
  { path: 'login', loadComponent: () => import('./components/auth/login/login.js').then(m => m.LoginComponent) },

  // tienda (cliente/admin autenticados)
  {
    path: 'tienda',
    loadComponent: () => import('./components/store/store.js').then(m => m.StoreComponent),
    canMatch: [canMatchAuth],
    data: { roles: ['CLIENT', 'CLIENTE', 'ADMIN', 'ADMINISTRATOR'] }
  },

  // ====== GESTIÓN ======
  // Admin ve todo:
  { path: 'producto', loadComponent: () => import('./components//product/product.js').then(m => m.ProductComponent),
    canMatch: [canMatchAuth, canMatchRole],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO','DISTRIBUIDOR'] } }, // todos los que ven gestión lo ven
  { path: 'cliente', loadComponent: () => import('./components/client/client.js').then(m => m.ClientComponent),
    canMatch: [canMatchAuth, canMatchRole],
    data: { roles: ['ADMIN','ADMINISTRATOR','DISTRIBUIDOR'] } },
  { path: 'venta', loadComponent: () => import('./components/sale/sale.js').then(m => m.SaleComponent),
    canMatch: [canMatchAuth, canMatchRole],
    data: { roles: ['ADMIN','ADMINISTRATOR','DISTRIBUIDOR'] } },
  { path: 'zona', loadComponent: () => import('./components/zone/zone.js').then(m => m.ZoneComponent),
    canMatch: [canMatchAuth, canMatchRole],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO','DISTRIBUIDOR'] } },
  { path: 'autoridad', loadComponent: () => import('./components/authority/authority.js').then(m => m.AuthorityComponent),
    canMatch: [canMatchAuth, canMatchRole],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'sobornos', loadComponent: () => import('./components/bribe/bribe.js').then(m => m.BribeComponent),
    canMatch: [canMatchAuth, canMatchRole],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'distribuidor', loadComponent: () => import('./components/distributor/distributor.js').then(m => m.DistributorComponent),
    canMatch: [canMatchAuth, canMatchRole],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },

  // ====== Sociedad (solo ADMIN + SOCIO) ======
  { path: 'decision', loadComponent: () => import('./components/decision/decision.js').then(m => m.DecisionComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'socio', loadComponent: () => import('./components/partner/partner.js').then(m => m.PartnerComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'consejo-shelby', loadComponent: () => import('./components/shelby-council/shelby-council.js').then(m => m.ShelbyCouncilComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'acuerdos-clandestinos', loadComponent: () => import('./components/clandestine-agreement/clandestine-agreement.js').then(m => m.ClandestineAgreementComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'revisiones-mensuales', loadComponent: () => import('./components/monthly-review/monthly-review.js').then(m => m.MonthlyReviewComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'tematica', loadComponent: () => import('./components/topic/topic.js').then(m => m.TopicComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },

  // ====== Admin ======
  { path: 'admin', loadComponent: () => import('./components/admin/admin.js').then(m => m.AdminComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR'] } },

  // ====== Bandeja ======
  // Admin
  { path: 'solicitudes-rol', loadComponent: () => import('./features/inbox/admin-role-request.js').then(m => m.AdminRoleRequestsComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR'] } },
  { path: 'verificacion-mail', loadComponent: () => import('./features/inbox/email-verification.js').then(m => m.EmailVerificationComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { roles: ['ADMIN','ADMINISTRATOR'] } },
  // Cliente base: su propia solicitud
  { path: 'mi-solicitud-rol', loadComponent: () => import('./components/role-request/role-request.js').then(m => m.RoleRequestComponent),
    canMatch: [canMatchAuth, canMatchRole], data: { onlyClientBase: true } },

  // Cuenta
  { path: 'mi-cuenta', loadComponent: () => import('./components/account/account.js').then(m => m.AccountComponent),
    canMatch: [canMatchAuth] },

  // Fallbacks
  //{ path: 'unauthorized', loadComponent: () => import('./pages/unauthorized/unauthorized').then(m => m.UnauthorizedComponent) },
  { path: '**', redirectTo: '' }
];
