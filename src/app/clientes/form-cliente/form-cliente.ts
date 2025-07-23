import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClientesService } from '../servicios/clientes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Cliente } from '../models/cliente.model';

@Component({
  selector: 'app-form-cliente',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-cliente.html',
})
export class FormClienteComponent implements OnInit {
  clienteForm!: FormGroup;
  id?: string;
  esEdicion = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      dni: ['', [Validators.required]],
      email: ['', [Validators.email]],
      telefono: [''],
      direccion: [''],
    });

    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.esEdicion = true;
        this.cargarCliente(this.id);
      }
    });
  }

  cargarCliente(id: string | undefined) {
    if (!id) {
      this.error = 'ID inválido';
      return;
    }
    this.clientesService.getCliente(id).subscribe({
      next: (cliente) => this.clienteForm.patchValue(cliente),
      error: () => (this.error = 'Error al cargar cliente'),
    });
  }


  guardar() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    const cliente: Omit<Cliente, 'id'> = this.clienteForm.value;

    if (this.esEdicion && this.id) {
      this.clientesService.actualizarCliente(this.id, cliente).subscribe({
        next: () => this.router.navigate(['/clientes']),
        error: () => (this.error = 'Error al actualizar cliente'),
      });
    } else {
      this.clientesService.crearCliente(cliente).subscribe({
        next: () => this.router.navigate(['/clientes']),
        error: () => (this.error = 'Error al crear cliente'),
      });
    }
  }
}
