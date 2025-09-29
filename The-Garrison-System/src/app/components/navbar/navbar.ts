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

  // Ítems de Gestión (tus nombres y rutas)
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

    // Primer cálculo (próximo tick) y en resize
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

  private isInicioActive(): boolean {
    return this.cleanUrl(this.router.url) === '';
  }

  private cleanUrl(url: string): string {
    const u = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
    return u === '/' ? '' : u;
  }

  logout(): void {
    this.auth.logout();
  }

  /** Posiciona el “glass” relativo al <ul.menu> (soporta cuando no hay Gestión) */
  private updateIndicator(): void {
    const menuEl = this.menuRef?.nativeElement;
    if (!menuEl || !this.mainBtns) return;

    const btnEls = this.mainBtns.toArray().map(r => r.nativeElement);
    const inicioEl = btnEls[0];           // siempre está
    const gestionEl = btnEls[1] ?? null;  // puede NO estar si no hay login

    let activeEl: HTMLElement | null = null;
    if (gestionEl && this.isGestionActive()) activeEl = gestionEl;
    else if (this.isInicioActive()) activeEl = inicioEl;
    else activeEl = inicioEl; // fallback

    if (!activeEl) { this.indicator.visible = false; return; }

    const menuRect = menuEl.getBoundingClientRect();
    const btnRect  = activeEl.getBoundingClientRect();

    const x = btnRect.left - menuRect.left;
    const y = btnRect.top  - menuRect.top;
    const w = btnRect.width;
    const h = btnRect.height;

    this.indicator = { x, y, w, h, visible: true };
  }
}
