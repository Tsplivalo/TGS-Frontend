/**
 * Configuración de rutas de la aplicación
 * 
 * Este archivo define todas las rutas de la aplicación organizadas por categorías:
 * - Rutas públicas (accesibles sin autenticación)
 * - Rutas de autenticación (solo para usuarios no autenticados)
 * - Rutas protegidas por roles específicos
 * - Rutas de administración
 * - Rutas de error y fallback
 */
import { Routes } from '@angular/router';
import {
  authGuard,
  guestGuard,
  roleGuard,
  canPurchaseGuard,
  profileCompleteGuard
} from './guards/auth.guard';
import { Role } from './models/user/user.model';

/**
 * Configuración de rutas de la aplicación con lazy loading
 * 
 * Las rutas están organizadas por funcionalidad y nivel de acceso:
 * - Rutas públicas: Accesibles para todos los usuarios
 * - Rutas de autenticación: Solo para usuarios no autenticados
 * - Rutas protegidas: Requieren autenticación y roles específicos
 * - Rutas de administración: Solo para administradores
 */
export const routes: Routes = [
  // ══════════════════════════════════════════════════════════════════════════
  // RUTAS PÚBLICAS - Accesibles sin autenticación
  // ══════════════════════════════════════════════════════════════════════════

  // Página principal de la aplicación
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./components/home/home').then(m => m.HomeComponent)
  },
  // Página informativa sobre la empresa
  {
    path: 'sobre-nosotros',
    loadComponent: () => import('./components/pages/about/about').then(m => m.AboutComponent)
  },
  // Página de preguntas frecuentes
  {
    path: 'faqs',
    loadComponent: () => import('./components/pages/faqs/faqs').then(m => m.FaqsComponent)
  },
  // Página de contacto
  {
    path: 'contactanos',
    loadComponent: () => import('./components/pages/contact/contact').then(m => m.ContactComponent)
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RUTAS DE AUTENTICACIÓN - Solo para usuarios NO autenticados
  // ══════════════════════════════════════════════════════════════════════════

  // Página de inicio de sesión
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.js').then(m => m.LoginComponent),
    title: 'Iniciar Sesión - GarrSYS'
  },
  // Página de registro de nuevos usuarios
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register').then(m => m.RegisterComponent),
    title: 'Registro - GarrSYS'
  },
  // Verificación de email con token en la URL
  {
    path: 'verify-email/:token',
    loadComponent: () => import('./features/inbox/email-verification/email-verification')
      .then(m => m.EmailVerificationComponent),
    title: 'Verificar Email - GarrSYS'
  },
  // Verificación de email con token como parámetro de consulta
  {
    path: 'verify-email',
    loadComponent: () => import('./features/inbox/email-verification/email-verification')
      .then(m => m.EmailVerificationComponent),
    title: 'Verificar Email - GarrSYS'
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TIENDA - Requiere autenticación y permisos de compra
  // ══════════════════════════════════════════════════════════════════════════

  // Catálogo de productos disponible para usuarios autenticados
  {
    path: 'tienda',
    loadComponent: () => import('./components/store/store').then(m => m.StoreComponent),
    canActivate: [
      authGuard, // Requiere estar autenticado
      roleGuard([Role.CLIENT, Role.ADMIN, Role.PARTNER, Role.DISTRIBUTOR, Role.USER]), // Roles permitidos
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE CUENTA - Requiere autenticación
  // ══════════════════════════════════════════════════════════════════════════

  // Panel de gestión personal del usuario
  {
    path: 'mi-cuenta',
    loadComponent: () => import('./components/account/account.js').then(m => m.AccountComponent),
    canActivate: [authGuard] // Requiere estar autenticado
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INBOX UNIFICADO - Centro de mensajes y notificaciones
  // ══════════════════════════════════════════════════════════════════════════

  // Sistema unificado de mensajes que se adapta según el rol del usuario
  {
    path: 'inbox',
    loadComponent: () => import('./features/inbox/pages/inbox-page').then(m => m.InboxPageComponent),
    canActivate: [authGuard] // Requiere estar autenticado
    // El componente maneja internamente la vista según el rol del usuario
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE NEGOCIO - Roles: ADMIN, PARTNER, DISTRIBUTOR
  // ══════════════════════════════════════════════════════════════════════════

  // Gestión de productos del catálogo
  {
    path: 'producto',
    loadComponent: () => import('./components/product/product.js').then(m => m.ProductComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER, Role.DISTRIBUTOR])
    ]
  },
  // Gestión de clientes
  {
    path: 'cliente',
    loadComponent: () => import('./components/client/client.js').then(m => m.ClientComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.DISTRIBUTOR])
    ]
  },
  // Gestión de ventas
  {
    path: 'venta',
    loadComponent: () => import('./components/sale/sale.js').then(m => m.SaleComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.DISTRIBUTOR])
    ]
  },
  // Gestión de zonas territoriales
  {
    path: 'zona',
    loadComponent: () => import('./components/zone/zone.js').then(m => m.ZoneComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER, Role.DISTRIBUTOR])
    ]
  },
  // Gestión de autoridades (solo ADMIN y PARTNER)
  {
    path: 'autoridad',
    loadComponent: () => import('./components/authority/authority.js').then(m => m.AuthorityComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  // Gestión de sobornos (solo ADMIN y PARTNER)
  {
    path: 'sobornos',
    loadComponent: () => import('./components/bribe/bribe.js').then(m => m.BribeComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  // Gestión de distribuidores (solo ADMIN y PARTNER)
  {
    path: 'distribuidor',
    loadComponent: () => import('./components/distributor/distributor.js').then(m => m.DistributorComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE SOCIEDAD - Solo ADMIN y PARTNER
  // ══════════════════════════════════════════════════════════════════════════

  // Gestión de decisiones corporativas
  {
    path: 'decision',
    loadComponent: () => import('./components/decision/decision.js').then(m => m.DecisionComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  // Gestión de socios
  {
    path: 'socio',
    loadComponent: () => import('./components/partner/partner.js').then(m => m.PartnerComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  // Gestión del consejo Shelby
  {
    path: 'consejo-shelby',
    loadComponent: () => import('./components/shelby-council/shelby-council.js').then(m => m.ShelbyCouncilComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  // Gestión de acuerdos clandestinos
  {
    path: 'acuerdos-clandestinos',
    loadComponent: () => import('./components/clandestine-agreement/clandestine-agreement.js').then(m => m.ClandestineAgreementComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  // Gestión de revisiones mensuales
  {
    path: 'revisiones-mensuales',
    loadComponent: () => import('./components/monthly-review/monthly-review.js').then(m => m.MonthlyReviewComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },
  // Gestión de temáticas
  {
    path: 'tematica',
    loadComponent: () => import('./components/topic/topic.js').then(m => m.TopicComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN, Role.PARTNER])
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADMINISTRACIÓN DEL SISTEMA - Solo ADMIN
  // ══════════════════════════════════════════════════════════════════════════

  // Panel de administración principal
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin.js').then(m => m.AdminComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN])
    ]
  },
  // Gestión de solicitudes de cambio de rol
  {
    path: 'solicitudes-rol',
    loadComponent: () => import('./features/inbox/components/role-requests/admin-role-requests-inbox.js').then(m => m.AdminRoleRequestsInboxComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN])
    ]
  },
  // Herramientas de verificación de email para administradores
  {
    path: 'verificacion-mail',
    loadComponent: () => import('./features/inbox/email-verification/email-verification').then(m => m.EmailVerificationComponent),
    canActivate: [
      authGuard,
      roleGuard([Role.ADMIN])
    ]
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PÁGINAS DE ERROR Y MANEJO DE EXCEPCIONES
  // ══════════════════════════════════════════════════════════════════════════

  // Página de error 403 - Acceso prohibido
  {
    path: 'forbidden',
    loadComponent: () => import('./components/errors/forbidden/forbidden').then(m => m.ForbiddenComponent)
  },
  // Página de error 404 - No encontrado (comentada temporalmente)
  //{ path: 'not-found', loadComponent: () => import('./pages/error/not-found/not-found').then(m => m.NotFoundComponent) },

  // ══════════════════════════════════════════════════════════════════════════
  // RUTA FALLBACK - Manejo de rutas no encontradas
  // ══════════════════════════════════════════════════════════════════════════

  // Redirige cualquier ruta no válida a la página de error 404
  {
    path: '**',
    redirectTo: 'not-found'
  }
];