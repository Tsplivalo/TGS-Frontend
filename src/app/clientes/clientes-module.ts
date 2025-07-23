import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ListaClientesComponent } from './lista-clientes/lista-clientes.js';
import { FormClienteComponent } from './form-cliente/form-cliente.js';
import { ClientesRoutingModule } from './clientes-routing-module.js';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, ClientesRoutingModule],
})
export class ClientesModule {}