import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-forbidden',
  imports: [CommonModule, RouterModule],
  template: `
    <section class="forbidden">
      <div class="card">
        <h1>Acceso denegado</h1>
        <p>No tenés permisos para ver esta página.</p>
        <div class="actions">
          <a routerLink="/" class="btn">Ir al inicio</a>
          <a routerLink="/tienda" class="btn btn-alt">Ir a la tienda</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .forbidden{
      min-height:calc(100dvh - 120px);
      display:grid; place-items:center; padding:1.5rem;
    }
    .card{
      max-width:560px; width:100%;
      background:rgba(30,41,59,.55);
      backdrop-filter: blur(12px);
      border:1px solid rgba(255,255,255,.18);
      border-radius:16px; padding:1.5rem;
      box-shadow:0 16px 36px rgba(0,0,0,.35);
      color:#fff; text-align:center;
    }
    h1{ margin:0 0 .5rem; font-size:1.6rem; }
    p{ opacity:.9; margin:0 0 1.25rem; }
    .actions{ display:flex; gap:.75rem; justify-content:center; flex-wrap:wrap; }
    .btn{
      display:inline-block; padding:.6rem 1rem; border-radius:10px;
      border:1px solid rgba(255,255,255,.22); color:#fff; text-decoration:none;
      background:rgba(255,255,255,.08);
    }
    .btn:hover{ background:rgba(255,255,255,.14); transform: translateY(-1px); }
    .btn-alt{ background:transparent; }
    .btn-alt:hover{ background:rgba(255,255,255,.08); }
  `]
})
export class ForbiddenComponent {}
