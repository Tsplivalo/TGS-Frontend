import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  styleUrls: ['./app.scss'],
  template: `
  <div class="layout">
    <header class="appbar">
      <div class="appbar__left">
        <a class="brand" routerLink="/">
          <img class="logo" src="/logo-garrison.png" alt="The Garrison System" />
          <span class="brand__text">The Garrison System</span>
        </a>
        <nav class="tabs">
          <a routerLink="/zona" routerLinkActive="active">Zonas</a>
          <a routerLink="/cliente" routerLinkActive="active">Clientes</a>
          <a routerLink="/producto" routerLinkActive="active">Productos</a>
          <a routerLink="/venta" routerLinkActive="active">Ventas</a>
          <a routerLink="/autoridad" routerLinkActive="active">Autoridades</a>
          <a routerLink="/sobornos" routerLinkActive="active">Sobornos</a>
        </nav>
      </div>
    </header>

    <main class="content container">
      <router-outlet></router-outlet>
    </main>
  </div>
  `
})
export class AppComponent {
  theme = signal<'dark' | 'light'>((localStorage.getItem('theme') as any) || 'dark');

  constructor() {
    if (this.theme() === 'light') document.documentElement.setAttribute('data-theme', 'light');
  }
  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }
}


