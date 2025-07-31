// app.routes.ts
import { Routes } from '@angular/router';
import { ZonaComponent } from './components/zona/zona';
import { ClienteComponent } from './components/cliente/cliente';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'zona', pathMatch: 'full' },
  { path: 'zona', component: ZonaComponent },
  { path: 'cliente', component: ClienteComponent },
];
