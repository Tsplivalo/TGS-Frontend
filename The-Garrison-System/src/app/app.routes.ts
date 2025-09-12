import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ZonaComponent } from './components/zona/zona';
import { ClienteComponent } from './components/cliente/cliente';
import { ProductoComponent } from './components/producto/producto';
import { VentaComponent } from './components/venta/venta';
import { AutoridadComponent } from './components/autoridad/autoridad';
import { SobornoComponent } from './components/soborno/soborno';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent },  // 👈 Página de inicio
  { path: 'zona', component: ZonaComponent },
  { path: 'cliente', component: ClienteComponent },
  { path: 'producto', component: ProductoComponent },
  { path: 'venta', component: VentaComponent },
  { path: 'autoridad', component: AutoridadComponent },
  { path: 'sobornos', component: SobornoComponent },
  { path: '**', redirectTo: '' } // fallback al home
];
