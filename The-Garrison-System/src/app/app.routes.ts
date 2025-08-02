import { Routes } from '@angular/router';
import { ZonaComponent } from './components/zona/zona';
import { ClienteComponent } from './components/cliente/cliente';
import { ProductoComponent } from './components/producto/producto';
import { UsuarioComponent } from './components/auth/usuario';
import { VentaComponent } from './components/venta/venta';
import { AutoridadComponent } from './components/autoridad/autoridad';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'zona', pathMatch: 'full' },
  { path: 'zona', component: ZonaComponent },
  { path: 'cliente', component: ClienteComponent },
  { path: 'producto', component: ProductoComponent },
  { path: 'usuario', component: UsuarioComponent },
  { path: 'venta', component: VentaComponent },
  { path: 'autoridad', component: AutoridadComponent },
];
