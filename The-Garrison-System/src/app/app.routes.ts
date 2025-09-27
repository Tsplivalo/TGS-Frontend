import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home'; // 👈 tu Home existente (standalone)

export const routes: Routes = [
  { path: '', component: HomeComponent }, // 👈 INICIO apunta al Home

  { path: 'producto',  loadComponent: () => import('./components/producto/producto').then(m => m.ProductoComponent) },
  { path: 'cliente',   loadComponent: () => import('./components/cliente/cliente').then(m => m.ClienteComponent) },
  { path: 'venta',     loadComponent: () => import('./components/venta/venta').then(m => m.VentaComponent) },
  { path: 'zona',      loadComponent: () => import('./components/zona/zona').then(m => m.ZonaComponent) },
  { path: 'autoridad', loadComponent: () => import('./components/autoridad/autoridad').then(m => m.AutoridadComponent) },
  { path: 'sobornos',  loadComponent: () => import('./components/soborno/soborno').then(m => m.SobornoComponent) },
  { path: 'decision',  loadComponent: () => import('./components/decision/decision').then(m => m.DecisionComponent) },
  { path: 'tematica',  loadComponent: () => import('./components/tematica/tematica').then(m => m.TematicaComponent) },

  { path: '**', redirectTo: '' },
];
