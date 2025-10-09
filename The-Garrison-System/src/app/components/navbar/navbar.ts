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

interface MenuItem { label: string; path: string; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent implements AfterViewInit {
  private auth = inject(AuthService);
  private routerSvc = inject(Router);

  // Señales de auth
  readonly isLoggedIn = this.auth.isLoggedIn;   // signal<boolean>
  readonly user       = this.auth.user;         // signal<{username?:string; email?:string; roles?:string[]}|null>

  // Marca
  readonly brand = 'GarrSYS';

  // Menú Gestión (solo admin)
  readonly gestionItems: MenuItem[] = [
    { label: 'Producto',     path: '/producto' },
    { label: 'Cliente',      path: '/cliente' },
    { label: 'Socio',        path: '/socio' },
    { label: 'Venta',        path: '/venta' },
    { label: 'Zona',         path: '/zona' },
    { label: 'Autoridad',    path: '/autoridad' },
    { label: 'Sobornos',     path: '/sobornos' },
    { label: 'Decisiones',   path: '/decision' },
    { label: 'Temática',     path: '/tematica' },
    { label: 'Distribuidor', path: '/distribuidor' },
  ];

  // Ítems públicos (siempre visibles, logueado o no)
  readonly publicItems: MenuItem[] = [
    { label: 'Sobre nosotros', path: '/sobre-nosotros' },
    { label: 'FAQs',           path: '/faqs' },
    { label: 'Contactanos',    path: '/contactanos' },
  ];

  // Ítems del cliente (también visibles para admin)
  readonly clientItems: MenuItem[] = [
    { label: 'Tienda',    path: '/tienda' },
  ];

  // Indicador subrayado del menú principal (izquierdo)
  indicator = { x: 0, y: 0, w: 0, h: 0, visible: false };

  @ViewChild('menu', { static: true }) menuRef!: ElementRef<HTMLUListElement>;
  @ViewChildren('mainBtn') buttons!: QueryList<ElementRef<HTMLAnchorElement | HTMLButtonElement>>;

  constructor(router: Router) {
    router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => setTimeout(() => this.updateIndicator(), 0));
  }

  ngAfterViewInit() { this.updateIndicator(); }

  // Helpers
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

  // Marca activo Gestión si la URL cae en alguna de sus rutas
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

  // Indicador subrayado del menú principal
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
