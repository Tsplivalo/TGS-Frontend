import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

interface MenuItem { label: string; path: string; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent implements AfterViewInit {
  readonly gestionItems: MenuItem[] = [
    { label: 'Productos', path: '/producto' },
    { label: 'Clientes', path: '/cliente' },
    { label: 'Ventas', path: '/venta' },
    { label: 'Zonas', path: '/zona' },
    { label: 'Autoridades', path: '/autoridad' },
    { label: 'Socios',      path: '/socio'      },
    { label: 'Sobornos', path: '/sobornos' },
    { label: 'Decisiones', path: '/decision' },
    { label: 'Temáticas', path: '/tematica' },
  ];

  @ViewChild('menu', { static: true }) menuRef!: ElementRef<HTMLElement>;
  @ViewChildren('mainBtn') mainBtns!: QueryList<ElementRef<HTMLElement>>;

  indicator = { x: 0, y: 0, w: 0, h: 0, visible: false };

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    const update = () => this.updateIndicator();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(update);

    // Primer cálculo y en próximo tick por seguridad
    setTimeout(update);
    // Recalcular en resize (layout responsive)
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

  /** Usa getBoundingClientRect relativo al <ul.menu> para evitar desfases por padding/márgenes */
  private updateIndicator(): void {
    const menuEl = this.menuRef?.nativeElement;
    if (!menuEl || !this.mainBtns || this.mainBtns.length < 2) return;

    const [inicioEl, gestionEl] = this.mainBtns.toArray().map(r => r.nativeElement);
    const activeEl = this.isGestionActive()
      ? gestionEl
      : this.isInicioActive()
        ? inicioEl
        : null;

    if (!activeEl) {
      this.indicator.visible = false;
      return;
    }

    const menuRect = menuEl.getBoundingClientRect();
    const btnRect  = activeEl.getBoundingClientRect();

    const x = btnRect.left - menuRect.left;   // posición horizontal dentro de .menu
    const y = btnRect.top  - menuRect.top;    // posición vertical dentro de .menu
    const w = btnRect.width;
    const h = btnRect.height;

    // Actualizamos en un solo paso para animaciones suaves
    this.indicator = { x, y, w, h, visible: true };
  }
}
