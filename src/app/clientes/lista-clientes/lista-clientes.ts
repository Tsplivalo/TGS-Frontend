import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule,Router } from '@angular/router';
import { Cliente } from '../models/cliente.model';
import { ClientesService } from '../servicios/clientes.service.js';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-clientes.html',
  providers: [],
})
export class ListaClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  cargando = false;
  error: string | null = null;

  constructor(private clientesService: ClientesService, private router: Router) {}

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.cargando = true;
    this.clientesService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar clientes';
        this.cargando = false;
      },
    });
  }

  editarCliente(id: string) {
    this.router.navigate(['/clientes/editar', id]);
  }

  eliminarCliente(id: string) {
    if (confirm('¿Eliminar cliente?')) {
      this.clientesService.eliminarCliente(id).subscribe(() => {
        this.cargarClientes();
      });
    }
  }

  nuevoCliente() {
    this.router.navigate(['/clientes/nuevo']);
  }
}
