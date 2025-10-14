import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

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
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENT', 'ADMIN', 'PARTNER', 'DISTRIBUTOR'] },
    loadComponent: () => import('./components/store/store').then(m => m.StoreComponent)
  },

  // ====== GESTIÓN ======
  // Admin ve todo:
  { path: 'producto', loadComponent: () => import('./components//product/product.js').then(m => m.ProductComponent),
    canMatch: [authGuard, roleGuard],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO','DISTRIBUIDOR'] } }, // todos los que ven gestión lo ven
  { path: 'cliente', loadComponent: () => import('./components/client/client.js').then(m => m.ClientComponent),
    canMatch: [authGuard, roleGuard],
    data: { roles: ['ADMIN','ADMINISTRATOR','DISTRIBUIDOR'] } },
  { path: 'venta', loadComponent: () => import('./components/sale/sale.js').then(m => m.SaleComponent),
    canMatch: [authGuard, roleGuard],
    data: { roles: ['ADMIN','ADMINISTRATOR','DISTRIBUIDOR'] } },
  { path: 'zona', loadComponent: () => import('./components/zone/zone.js').then(m => m.ZoneComponent),
    canMatch: [authGuard, roleGuard],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO','DISTRIBUIDOR'] } },
  { path: 'autoridad', loadComponent: () => import('./components/authority/authority.js').then(m => m.AuthorityComponent),
    canMatch: [authGuard, roleGuard],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'sobornos', loadComponent: () => import('./components/bribe/bribe').then(m => m.BribeComponent),
    canMatch: [authGuard, roleGuard],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'distribuidor', loadComponent: () => import('./components/distributor/distributor.js').then(m => m.DistributorComponent),
    canMatch: [authGuard, roleGuard],
    data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },

  // ====== Sociedad (solo ADMIN + SOCIO) ======
  { path: 'decision', loadComponent: () => import('./components/decision/decision.js').then(m => m.DecisionComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'socio', loadComponent: () => import('./components/partner/partner.js').then(m => m.PartnerComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'consejo-shelby', loadComponent: () => import('./components/shelby-council/shelby-council.js').then(m => m.ShelbyCouncilComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'acuerdos-clandestinos', loadComponent: () => import('./components/clandestine-agreement/clandestine-agreement.js').then(m => m.ClandestineAgreementComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'revisiones-mensuales', loadComponent: () => import('./components/monthly-review/monthly-review.js').then(m => m.MonthlyReviewComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },
  { path: 'tematica', loadComponent: () => import('./components/topic/topic.js').then(m => m.TopicComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR','SOCIO'] } },

  // ====== Admin ======
  { path: 'admin', loadComponent: () => import('./components/admin/admin.js').then(m => m.AdminComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR'] } },

  // ====== Bandeja ======
  // Admin
  { path: 'solicitudes-rol', loadComponent: () => import('./features/inbox/admin-role-request.js').then(m => m.AdminRoleRequestsComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR'] } },
  { path: 'verificacion-mail', loadComponent: () => import('./features/inbox/email-verification.js').then(m => m.EmailVerificationComponent),
    canMatch: [authGuard, roleGuard], data: { roles: ['ADMIN','ADMINISTRATOR'] } },
  // Cliente base: su propia solicitud
  { path: 'mi-solicitud-rol', loadComponent: () => import('./components/role-request/role-request.js').then(m => m.RoleRequestComponent),
    canMatch: [authGuard, roleGuard], data: { onlyClientBase: true } },

  // Cuenta
  { path: 'mi-cuenta', loadComponent: () => import('./components/account/account.js').then(m => m.AccountComponent),
    canMatch: [authGuard] },

  // Fallbacks
  { path: 'forbidden', loadComponent: () => import('./components/errors/forbidden/forbidden').then(m => m.ForbiddenComponent) },
  { path: '**', redirectTo: '' }
];
