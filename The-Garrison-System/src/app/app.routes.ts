import { Routes } from '@angular/router';
import { ClienteComponent } from './components/cliente/cliente';
import { ZonaComponent } from './components/zona/zona';

export const appRoutes: Routes = [
  { path: 'zonas', component: ZonaComponent },
  { path: 'clientes', component: ClienteComponent },
];