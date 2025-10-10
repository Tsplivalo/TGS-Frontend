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

/**
 * NavbarComponent
 *
 * Barra superior con:
 * - Ítems públicos, de cliente y de gestión (según rol)
 * - Selector de idioma (i18n)
 * - Indicador "subrayado" que sigue al link activo
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent implements AfterViewInit {
  // --- Inyección ---
  private auth = inject(AuthService);
  private routerSvc = inject(Router);
  private i18n = inject(I18nService);

  // --- Estado de auth (signals expuestos por AuthService) ---
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly user       = this.auth.user;

  // --- Marca ---
  readonly brand = 'GarrSYS';

  // --- i18n helpers ---
  lang(): 'en'|'es' { return (this.i18n.current as 'en'|'es') || 'en'; }
  setLang(l: 'en'|'es') { this.i18n.use(l); }
  flagClass(): string   { return this.lang() === 'es' ? 'flag flag-es' : 'flag flag-en'; }

  // --- Menús ---
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
  ];

  readonly publicItems: MenuItem[] = [
    { label: 'nav.about',   path: '/sobre-nosotros' },
    { label: 'nav.faqs',    path: '/faqs' },
    { label: 'nav.contact', path: '/contactanos' },
  ];

  readonly clientItems: MenuItem[] = [
    { label: 'nav.store', path: '/tienda' },
  ];

  // --- Indicador animado del menú izquierdo ---
  indicator = { x: 0, y: 0, w: 0, h: 0, visible: false };

  @ViewChild('menu', { static: true }) menuRef!: ElementRef<HTMLUListElement>;
  @ViewChildren('mainBtn') buttons!: QueryList<ElementRef<HTMLAnchorElement | HTMLButtonElement>>;

  constructor(router: Router) {
    // Recalcula el indicador cuando cambia la ruta
    router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => setTimeout(() => this.updateIndicator(), 0));
  }

  ngAfterViewInit() { this.updateIndicator(); }

  // --- Helpers de roles ---
  isAuthenticated(): boolean { return !!this.isLoggedIn(); }

  isClient(): boolean {
    const roles = this.user()?.roles ?? [];
    return roles.includes('CLIENT') || roles.includes('CLIENTE');
  }

  isAdmin(): boolean {
    const roles = this.user()?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('ADMINISTRATOR');
  }

  trackByPath(_i: number, it: MenuItem) { return it.path; }

  // Grupo Gestión activo si la URL comienza con alguno de sus paths
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
      || url.startsWith('/distribuidor');
  }

  logout() { this.auth.logout(); }

  // Posiciona el subrayado bajo el ítem activo
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
