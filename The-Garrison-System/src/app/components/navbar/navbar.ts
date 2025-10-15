import {
  AfterViewInit,
  Component,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, Role } from '../../services/auth/auth'; 
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

  readonly isLoggedIn = computed(() => this.auth.isAuthenticated());
  readonly user = computed(() => this.auth.user());
  readonly currentRoles = computed(() => this.auth.currentRoles());
  readonly profileCompleteness = computed(() => this.auth.profileCompleteness());

  readonly brand = 'GarrSYS';

  lang(): 'en' | 'es' { return (this.i18n.current as 'en' | 'es') || 'en'; }
  setLang(l: 'en' | 'es') { this.i18n.use(l); }
  flagClass(): string { return this.lang() === 'es' ? 'flag flag-es' : 'flag flag-en'; }

  readonly gestionItems: MenuItem[] = [
    { label: 'mgmt.product', path: '/producto' },
    { label: 'mgmt.client', path: '/cliente' },
    { label: 'mgmt.partner', path: '/socio' },
    { label: 'mgmt.sale', path: '/venta' },
    { label: 'mgmt.zone', path: '/zona' },
    { label: 'mgmt.authority', path: '/autoridad' },
    { label: 'mgmt.bribe', path: '/sobornos' },
    { label: 'mgmt.decision', path: '/decision' },
    { label: 'mgmt.topic', path: '/tematica' },
    { label: 'mgmt.distributor', path: '/distribuidor' },
    { label: 'mgmt.shelbyCouncil', path: '/consejo-shelby' },
    { label: 'mgmt.monthlyReview', path: '/revisiones-mensuales' },
    { label: 'mgmt.clandestineAgreement', path: '/acuerdos-clandestinos' },
    { label: 'mgmt.admin', path: '/admin' },
  ];

  readonly publicItems: MenuItem[] = [
    { label: 'nav.about', path: '/sobre-nosotros' },
    { label: 'nav.faqs', path: '/faqs' },
    { label: 'nav.contact', path: '/contactanos' },
  ];

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

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  private roles(): Role[] {
    return this.currentRoles();
  }

  isClient(): boolean {
    return this.auth.hasRole(Role.CLIENT);
  }

  isAdmin(): boolean {
    return this.auth.hasRole(Role.ADMIN);
  }

  isPartner(): boolean {
    return this.auth.hasRole(Role.PARTNER);
  }

  isDistributor(): boolean {
    return this.auth.hasRole(Role.DISTRIBUTOR);
  }

  isAuthority(): boolean {
    return this.auth.hasRole(Role.AUTHORITY);
  }

  isOnlyClient(): boolean {
    const roles = this.roles();
    const hasClient = roles.includes(Role.CLIENT);
    const hasOther = roles.some(r => 
      r === Role.ADMIN || 
      r === Role.PARTNER || 
      r === Role.DISTRIBUTOR || 
      r === Role.AUTHORITY
    );
    return hasClient && !hasOther;
  }

  /**
   * ✅ CAMBIO: Los clientes pueden ver la tienda siempre
   * Solo necesitan perfil completo + email verificado para COMPRAR
   */
  canAccessStore(): boolean {
    return this.isClient() || this.isAdmin();
  }

  /**
   * Verifica si el usuario puede comprar (email verificado + perfil completo)
   * Se usa en la página de la tienda, no aquí
   */
  canPurchase(): boolean {
    return this.auth.canPurchase();
  }

  displayName(): string {
    const user = this.user();
    return user?.username || 'Usuario';
  }

  getProfileCompleteness(): number {
    return this.profileCompleteness();
  }

  isProfileComplete(): boolean {
    return this.profileCompleteness() === 100;
  }

  isEmailVerified(): boolean {
    return this.user()?.emailVerified ?? false;
  }

  inboxCount(): number {
    return 0;
  }

  trackByPath(_i: number, it: MenuItem) { return it.path; }

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

  isInboxActive(): boolean {
    const url = this.routerSvc.url || '';
    return url.startsWith('/inbox');
  }

  logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.auth.logout().subscribe({
        next: () => {
          console.log('[Navbar] Logout successful');
        },
        error: (err) => {
          console.error('[Navbar] Logout error:', err);
          this.routerSvc.navigate(['/login']);
        }
      });
    }
  }

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
    const btnRect = activeEl.getBoundingClientRect();
    const x = btnRect.left - menuRect.left;
    const y = btnRect.top - menuRect.top;
    const w = btnRect.width;
    const h = btnRect.height;

    this.indicator = { x, y, w, h, visible: true };
  }
}