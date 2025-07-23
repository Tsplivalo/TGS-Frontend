import { Routes } from '@angular/router';
import { ListaClientesComponent } from './clientes/lista-clientes/lista-clientes';

export const routes: Routes = [
  { path: '', redirectTo: 'clientes', pathMatch: 'full' },
  { path: 'clientes', loadChildren: () => import('./clientes/clientes-module').then(m => m.ClientesModule) },
];
