import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  // === Home ===
  { path: '', component: HomeComponent },

  // === Gestión (ya existentes) ===
  { path: 'producto',  loadComponent: () => import('./components/producto/producto').then(m => m.ProductoComponent) },
  { path: 'cliente',   loadComponent: () => import('./components/cliente/cliente').then(m => m.ClienteComponent) },
  { path: 'socio',     loadComponent: () => import('./components/socio/socio').then(m => m.SocioComponent) }, 
  { path: 'venta',     loadComponent: () => import('./components/venta/venta').then(m => m.VentaComponent) },
  { path: 'zona',      loadComponent: () => import('./components/zona/zona').then(m => m.ZonaComponent) },
  { path: 'autoridad', loadComponent: () => import('./components/autoridad/autoridad').then(m => m.AutoridadComponent) },
  { path: 'sobornos',  loadComponent: () => import('./components/soborno/soborno').then(m => m.SobornoComponent) },
  { path: 'decision',  loadComponent: () => import('./components/decision/decision').then(m => m.DecisionComponent) },
  { path: 'tematica',  loadComponent: () => import('./components/tematica/tematica').then(m => m.TematicaComponent) },

  // === Páginas estáticas (nuevas) ===
  { path: 'sobre-nosotros', loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent) },
  { path: 'contactanos',    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'faqs',           loadComponent: () => import('./pages/faqs/faqs.component').then(m => m.FaqsComponent) },

  // === Wildcard ===
  { path: '**', redirectTo: '' },
];
