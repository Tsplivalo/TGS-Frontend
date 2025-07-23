import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListaClientesComponent } from './lista-clientes/lista-clientes.js';
import { FormClienteComponent } from './form-cliente/form-cliente.js';

const routes: Routes = [
  { path: '', component: ListaClientesComponent },
  { path: 'nuevo', component: FormClienteComponent },
  { path: 'editar/:id', component: FormClienteComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientesRoutingModule {}
