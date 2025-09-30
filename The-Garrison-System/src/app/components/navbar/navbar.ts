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
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly user = this.auth.user;

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

  indicator = { x: 0, y: 0, w: 0, h: 0, visible: false };

  @ViewChild('menu', { static: true }) menuRef!: ElementRef<HTMLElement>;
  @ViewChildren('mainBtn') mainBtns!: QueryList<ElementRef<HTMLElement>>;

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => setTimeout(() => this.updateIndicator(), 0));
  }

  ngAfterViewInit(): void { setTimeout(() => this.updateIndicator(), 0); }

  isGestionActive(): boolean {
    const u = this.cleanUrl(this.router.url);
    return this.gestionItems.some(({ path }) => {
      const base = path.replace(/\/+$/, '');
      return u === base || u.startsWith(base + '/');
    });
  }

  private cleanUrl(url: string): string {
    const u = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
    return u === '/' ? '' : u;
    }

  logout() { this.auth.logout(); }

  private updateIndicator() {
    const menuEl = this.menuRef?.nativeElement;
    const activeEl = menuEl?.querySelector('.menu__item a.active, .menu__item--dropdown > .has-underline.active') as HTMLElement | null;
    if (!menuEl || !activeEl) { this.indicator.visible = false; return; }

    const m = menuEl.getBoundingClientRect();
    const b = activeEl.getBoundingClientRect();
    this.indicator = { x: b.left - m.left, y: b.top - m.top, w: b.width, h: b.height, visible: true };
  }
}
