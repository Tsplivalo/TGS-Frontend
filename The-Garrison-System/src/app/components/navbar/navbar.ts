import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
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
  // Sesión
  private auth = inject(AuthService);
  readonly isLoggedIn = this.auth.isLoggedIn; // signal<boolean>
  readonly user       = this.auth.user;       // signal<{ username: string } | null>

  // Ítems de Gestión (logueado)
  readonly gestionItems: MenuItem[] = [
    { label: 'Productos',   path: '/producto' },
    { label: 'Clientes',    path: '/cliente' },
    { label: 'Ventas',      path: '/venta' },
    { label: 'Zonas',       path: '/zona' },
    { label: 'Autoridades', path: '/autoridad' },
    { label: 'Socios',      path: '/socio' },
    { label: 'Sobornos',    path: '/sobornos' },
    { label: 'Decisiones',  path: '/decision' },
    { label: 'Temáticas',   path: '/tematica' },
  ];

  @ViewChild('menu', { static: true }) menuRef!: ElementRef<HTMLElement>;
  @ViewChildren('mainBtn') mainBtns!: QueryList<ElementRef<HTMLElement>>;

  indicator = { x: 0, y: 0, w: 0, h: 0, visible: false };

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    const update = () => this.updateIndicator();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(update);
    setTimeout(update);
    window.addEventListener('resize', update, { passive: true });
  }

  isGestionActive(): boolean {
    const current = this.cleanUrl(this.router.url);
    return this.gestionItems.some(({ path }) => {
      const base = path.replace(/\/+$/, '');
      return current === base || current.startsWith(base + '/');
    });
  }

  private cleanUrl(url: string): string {
    const u = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
    return u === '/' ? '' : u;
  }

  logout(): void { this.auth.logout(); }

  /** Indicador: busca elemento activo; si no hay (estado deslogueado en Home), se oculta. */
  private updateIndicator(): void {
    const menuEl = this.menuRef?.nativeElement;
    if (!menuEl) { this.indicator.visible = false; return; }

    const activeEl = menuEl.querySelector(
      '.menu__item a.active, .menu__item--dropdown > .dropdown__toggle.active, .menu__item--dropdown > .has-underline.active'
    ) as HTMLElement | null;

    if (!activeEl) { this.indicator.visible = false; return; }

    const menuRect = menuEl.getBoundingClientRect();
    const btnRect  = activeEl.getBoundingClientRect();

    this.indicator = {
      x: btnRect.left - menuRect.left,
      y: btnRect.top  - menuRect.top,
      w: btnRect.width,
      h: btnRect.height,
      visible: true,
    };
  }
}
