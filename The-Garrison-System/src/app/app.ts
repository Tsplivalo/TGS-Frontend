import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header style="background-color: #343a40; padding: 1rem;">
      <h1 style="color: #fff; margin: 0; font-size: 1.8rem;">The Garrison System</h1>
    </header>

    <nav style="display: flex; gap: 1rem; padding: 1rem; background-color: #f8f9fa; border-bottom: 1px solid #ccc;">
      <a routerLink="/zona" style="text-decoration: none; color: #007bff;">Zona</a>
      <a routerLink="/cliente" style="text-decoration: none; color: #007bff;">Cliente</a>
      <a routerLink="/producto" style="text-decoration: none; color: #007bff;">Producto</a>
      <a routerLink="/usuario" style="text-decoration: none; color: #007bff;">Usuario</a>
      <a routerLink="/venta" style="text-decoration: none; color: #007bff;">Venta</a>
      <a routerLink="/autoridad" style="text-decoration: none; color: #007bff;">Autoridad</a>
    </nav>

    <main style="padding: 2rem;">
      <router-outlet></router-outlet>
    </main>

  `,
})
export class AppComponent {}
