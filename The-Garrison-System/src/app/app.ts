import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, HttpClientModule],
  template: `
    <h1>Mi App</h1>
    <nav>
      <a routerLink="/zona">Zona</a>
      <a routerLink="/cliente">Cliente</a>
    </nav>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
