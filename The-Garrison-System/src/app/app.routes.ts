// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { 
  authGuard, 
  guestGuard,
  roleGuard,
  canPurchaseGuard,
  profileCompleteGuard 
} from './guards/auth.guard';
import { Role } from './services/auth/auth';

export const routes: Routes = [
  // ══════════════════════════════════════════════════════════════════════════
  // RUTAS PÚBLICAS
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: '', 
    pathMatch: 'full', 
    loadComponent: () => import('./components/home/home').then(m => m.HomeComponent) 
  },
  { 
    path: 'sobre-nosotros', 
    loadComponent: () => import('./components/pages/about/about').then(m => m.AboutComponent) 
  },
  { 
    path: 'faqs', 
    loadComponent: () => import('./components/pages/faqs/faqs').then(m => m.FaqsComponent) 
  },
  { 
    path: 'contactanos', 
    loadComponent: () => import('./components/pages/contact/contact').then(m => m.ContactComponent) 
  },

  {
  path: 'tools/backup',
  loadComponent: () => import('./tools/backup-export.component').then(m => m.BackupExportComponent)
  },
  
  // ══════════════════════════════════════════════════════════════════════════
  // AUTENTICACIÓN (Solo para NO autenticados)
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login/login.js').then(m => m.LoginComponent),
    canActivate: [guestGuard] // ← Solo accesible si NO está autenticado
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/auth/register/register').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./services/auth/verify-email/verify-email').then(m => m.VerifyEmailComponent),
    canActivate: [authGuard] // ← Requiere estar autenticado
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TIENDA (Requiere autenticación + permiso para comprar)
  // ══════════════════════════════════════════════════════════════════════════
  {
    path: 'tienda',
    loadComponent: () => import('./components/store/store').then(m => m.StoreComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.CLIENT, Role.ADMIN, Role.PARTNER, Role.DISTRIBUTOR]),
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MI CUENTA (Requiere autenticación)
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: 'mi-cuenta', 
    loadComponent: () => import('./components/account/account.js').then(m => m.AccountComponent),
    canActivate: [authGuard]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INBOX UNIFICADO (Requiere autenticación)
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: 'inbox', 
    loadComponent: () => import('./features/inbox/pages/inbox-page').then(m => m.InboxPageComponent),
    canActivate: [authGuard]
    // ℹ️ El componente maneja internamente la vista según el rol
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIÓN (Roles: ADMIN, PARTNER, DISTRIBUTOR)
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: 'producto', 
    loadComponent: () => import('./components/product/product.js').then(m => m.ProductComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER, Role.DISTRIBUTOR])
    ]
  },
  { 
    path: 'cliente', 
    loadComponent: () => import('./components/client/client.js').then(m => m.ClientComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.DISTRIBUTOR])
    ]
  },
  { 
    path: 'venta', 
    loadComponent: () => import('./components/sale/sale.js').then(m => m.SaleComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.DISTRIBUTOR])
    ]
  },
  { 
    path: 'zona', 
    loadComponent: () => import('./components/zone/zone.js').then(m => m.ZoneComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER, Role.DISTRIBUTOR])
    ]
  },
  { 
    path: 'autoridad', 
    loadComponent: () => import('./components/authority/authority.js').then(m => m.AuthorityComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  { 
    path: 'sobornos', 
    loadComponent: () => import('./components/bribe/bribe.js').then(m => m.BribeComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  { 
    path: 'distribuidor', 
    loadComponent: () => import('./components/distributor/distributor.js').then(m => m.DistributorComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SOCIEDAD (Solo ADMIN + PARTNER)
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: 'decision', 
    loadComponent: () => import('./components/decision/decision.js').then(m => m.DecisionComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  { 
    path: 'socio', 
    loadComponent: () => import('./components/partner/partner.js').then(m => m.PartnerComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  { 
    path: 'consejo-shelby', 
    loadComponent: () => import('./components/shelby-council/shelby-council.js').then(m => m.ShelbyCouncilComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  { 
    path: 'acuerdos-clandestinos', 
    loadComponent: () => import('./components/clandestine-agreement/clandestine-agreement.js').then(m => m.ClandestineAgreementComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  { 
    path: 'revisiones-mensuales', 
    loadComponent: () => import('./components/monthly-review/monthly-review.js').then(m => m.MonthlyReviewComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  { 
    path: 'tematica', 
    loadComponent: () => import('./components/topic/topic.js').then(m => m.TopicComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADMINISTRACIÓN (Solo ADMIN)
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: 'admin', 
    loadComponent: () => import('./components/admin/admin.js').then(m => m.AdminComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN])
    ]
  },
  { 
    path: 'solicitudes-rol', 
    loadComponent: () => import('./features/inbox/components/role-requests/admin-role-requests-inbox.js').then(m => m.AdminRoleRequestsInboxComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN])
    ]
  },
  { 
    path: 'verificacion-mail', 
    loadComponent: () => import('./features/inbox/email-verification/email-verification').then(m => m.EmailVerificationComponent),
    canActivate: [
      authGuard, 
      roleGuard([Role.ADMIN])
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PÁGINAS DE ERROR
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: 'forbidden', 
    loadComponent: () => import('./components/errors/forbidden/forbidden').then(m => m.ForbiddenComponent) 
  },
  //{ path: 'not-found', loadComponent: () => import('./pages/error/not-found/not-found').then(m => m.NotFoundComponent) },

  // ══════════════════════════════════════════════════════════════════════════
  // FALLBACK
  // ══════════════════════════════════════════════════════════════════════════
  { 
    path: '**', 
    redirectTo: 'not-found' 
  }
];