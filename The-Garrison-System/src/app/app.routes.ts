import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },

  // Auth
  { path: 'login',    loadComponent: () => import('./components/auth/login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/auth/register/register').then(m => m.RegisterComponent) },

  // Gestión (protegidas)
  { path: 'producto',  canActivate: [authGuard], loadComponent: () => import('./components/producto/producto').then(m => m.ProductoComponent) },
  { path: 'cliente',   canActivate: [authGuard], loadComponent: () => import('./components/cliente/cliente').then(m => m.ClienteComponent) },
  { path: 'socio',     canActivate: [authGuard], loadComponent: () => import('./components/socio/socio').then(m => m.SocioComponent) }, 
  { path: 'venta',     canActivate: [authGuard], loadComponent: () => import('./components/venta/venta').then(m => m.VentaComponent) },
  { path: 'zona',      canActivate: [authGuard], loadComponent: () => import('./components/zona/zona').then(m => m.ZonaComponent) },
  { path: 'autoridad', canActivate: [authGuard], loadComponent: () => import('./components/autoridad/autoridad').then(m => m.AutoridadComponent) },
  { path: 'sobornos',  canActivate: [authGuard], loadComponent: () => import('./components/soborno/soborno').then(m => m.SobornoComponent) },
  { path: 'decision',  canActivate: [authGuard], loadComponent: () => import('./components/decision/decision').then(m => m.DecisionComponent) },
  { path: 'tematica',  canActivate: [authGuard], loadComponent: () => import('./components/tematica/tematica').then(m => m.TematicaComponent) },

  { path: '**', redirectTo: '' },
];
