import {
  AfterViewInit,
  Component,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth';
import { I18nService } from '../../services/i18n/i18n.js';
import { TranslateModule } from '@ngx-translate/core';

interface MenuItem { label: string; path: string; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent implements AfterViewInit {
  private auth = inject(AuthService);
  private routerSvc = inject(Router);
  private i18n = inject(I18nService);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly user       = this.auth.user;

  readonly brand = 'GarrSYS';

  lang(): 'en'|'es' { return (this.i18n.current as 'en'|'es') || 'en'; }
  setLang(l: 'en'|'es') { this.i18n.use(l); }
  flagClass(): string   { return this.lang() === 'es' ? 'flag flag-es' : 'flag flag-en'; }

  // Gestión (ADMIN usa este bloque si decide iterarlo)
  readonly gestionItems: MenuItem[] = [
    { label: 'mgmt.product',     path: '/producto' },
    { label: 'mgmt.client',      path: '/cliente' },
    { label: 'mgmt.partner',     path: '/socio' },
    { label: 'mgmt.sale',        path: '/venta' },
    { label: 'mgmt.zone',        path: '/zona' },
    { label: 'mgmt.authority',   path: '/autoridad' },
    { label: 'mgmt.bribe',       path: '/sobornos' },
    { label: 'mgmt.decision',    path: '/decision' },
    { label: 'mgmt.topic',       path: '/tematica' },
    { label: 'mgmt.distributor', path: '/distribuidor' },
    { label: 'mgmt.shelbyCouncil',        path: '/consejo-shelby' },
    { label: 'mgmt.monthlyReview',        path: '/revisiones-mensuales' },
    { label: 'mgmt.clandestineAgreement', path: '/acuerdos-clandestinos' },
    { label: 'mgmt.admin',                path: '/admin' },
  ];

  // Inbox ADMIN
  private readonly inboxItemsAdmin: MenuItem[] = [
    { label: 'nav.roleRequests',     path: '/solicitudes-rol' },
    { label: 'nav.mailVerification', path: '/verificacion-mail' },
  ];

  // Inbox CLIENTE base
  private readonly inboxItemsClient: MenuItem[] = [
    { label: 'nav.myRoleRequest', path: '/mi-solicitud-rol' }, // Ruta de estado de solicitud
  ];

  // Páginas públicas
  readonly publicItems: MenuItem[] = [
    { label: 'nav.about',   path: '/sobre-nosotros' },
    { label: 'nav.faqs',    path: '/faqs' },
    { label: 'nav.contact', path: '/contactanos' },
  ];

  // Ítems cliente (si está autenticado como client/admin)
  readonly clientItems: MenuItem[] = [
    { label: 'nav.store', path: '/tienda' },
  ];

  indicator = { x: 0, y: 0, w: 0, h: 0, visible: false };

  @ViewChild('menu', { static: true }) menuRef!: ElementRef<HTMLUListElement>;
  @ViewChildren('mainBtn') buttons!: QueryList<ElementRef<HTMLAnchorElement | HTMLButtonElement>>;

  constructor(router: Router) {
    router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => setTimeout(() => this.updateIndicator(), 0));
  }

  ngAfterViewInit() { this.updateIndicator(); }

  // ===== Helpers DEV (mock sin backend) =====
  private hasBypass(): boolean {
    try { return localStorage.getItem('authBypass') === 'true'; } catch { return false; }
  }
  private mockRoles(): string[] {
    try {
      const raw = localStorage.getItem('mockRoles');
      return raw ? raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [];
    } catch { return []; }
  }
  private mockNotifCount(): number {
    // Para simular notificaciones de cliente: setear localStorage.setItem('mockClientInbox', JSON.stringify([...]))
    try {
      const raw = localStorage.getItem('mockClientInbox');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.length : 0;
    } catch { return 0; }
  }

  // --- Helpers de roles / auth ---
  isAuthenticated(): boolean {
    return !!this.isLoggedIn() || this.hasBypass();
  }

  private roles(): string[] {
    const mocked = this.mockRoles();
    if (mocked.length) return mocked;
    const rs = this.user()?.roles ?? [];
    return Array.isArray(rs) ? rs.map(r => (r || '').toString().toUpperCase()) : [];
  }

  isClient(): boolean {
    const r = this.roles();
    return r.includes('CLIENT') || r.includes('CLIENTE');
  }
  isAdmin(): boolean {
    const r = this.roles();
    return r.includes('ADMIN') || r.includes('ADMINISTRATOR');
  }
  isSocio(): boolean {
    return this.roles().includes('SOCIO');
  }
  isDistribuidor(): boolean {
    return this.roles().includes('DISTRIBUIDOR');
  }

  /** Cliente base = solo CLIENT/CLIENTE (sin ADMIN/SOCIO/DISTRIBUIDOR) */
  isOnlyClient(): boolean {
    const r = new Set(this.roles());
    const isClient = r.has('CLIENT') || r.has('CLIENTE');
    const hasOther = r.has('ADMIN') || r.has('ADMINISTRATOR') || r.has('SOCIO') || r.has('DISTRIBUIDOR');
    return isClient && !hasOther;
  }

  /** Items de Inbox según el rol */
  inboxItems(): MenuItem[] {
    if (this.isAdmin()) return this.inboxItemsAdmin;
    if (this.isOnlyClient()) return this.inboxItemsClient;
    return []; // otros roles sin inbox (según tu regla)
  }

  /** Contador de notificaciones: admin puede tener otros contadores; aquí priorizamos cliente base */
  inboxCount(): number {
    if (this.isOnlyClient()) return this.mockNotifCount();
    return 0;
  }

  trackByPath(_i: number, it: MenuItem) { return it.path; }

  // Activo: Gestión
  isGestionActive(): boolean {
    const url = this.routerSvc.url || '';
    return url.startsWith('/producto')
      || url.startsWith('/cliente')
      || url.startsWith('/socio')
      || url.startsWith('/venta')
      || url.startsWith('/zona')
      || url.startsWith('/autoridad')
      || url.startsWith('/sobornos')
      || url.startsWith('/decision')
      || url.startsWith('/tematica')
      || url.startsWith('/distribuidor')
      || url.startsWith('/consejo-shelby')
      || url.startsWith('/revisiones-mensuales')
      || url.startsWith('/acuerdos-clandestinos')
      || url.startsWith('/admin');
  }

  // Activo: Inbox (admin o cliente base)
  isInboxActive(): boolean {
    const url = this.routerSvc.url || '';
    return url.startsWith('/solicitudes-rol')
        || url.startsWith('/verificacion-mail')
        || url.startsWith('/mi-solicitud-rol');
  }

  logout() { this.auth.logout(); }

  private updateIndicator() {
    const menuEl = this.menuRef?.nativeElement;
    const activeEl = menuEl?.querySelector(
      '.menu__item a.active, .menu__item--dropdown > .has-underline.active'
    ) as HTMLElement | null;

    if (!menuEl || !activeEl) {
      this.indicator.visible = false;
      return;
    }

    const menuRect = menuEl.getBoundingClientRect();
    const btnRect  = activeEl.getBoundingClientRect();
    const x = btnRect.left - menuRect.left;
    const y = btnRect.top  - menuRect.top;
    const w = btnRect.width;
    const h = btnRect.height;

    this.indicator = { x, y, w, h, visible: true };
  }
}
