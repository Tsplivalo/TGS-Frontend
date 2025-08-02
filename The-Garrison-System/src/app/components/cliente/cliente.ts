// src/app/components/cliente/cliente.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }            from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClienteService }          from '../../services/cliente/cliente';
import { ClienteDTO }              from '../../models/cliente/cliente.model';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [ CommonModule, FormsModule, ReactiveFormsModule ],
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.scss'],
})
export class ClienteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);

  clientes: ClienteDTO[] = [];
  createForm!: FormGroup;
  editForm!: FormGroup;
  editingDni: string | null = null;

  ngOnInit() {
    this.buildForms();
    this.loadClientes();
  }

  buildForms() {
    this.createForm = this.fb.group({
      dni:       ['', Validators.required],
      nombre:    ['', Validators.required],
      email:     ['', [Validators.email]],
      direccion: [''],
      telefono:  ['']
    });
    this.editForm = this.fb.group({
      dni:       [{ value: '', disabled: true }],
      nombre:    ['', Validators.required],
      email:     ['', [Validators.email]],
      direccion: [''],
      telefono:  ['']
    });
  }

  loadClientes() {
    this.clienteService.getAllClientes().subscribe({
      next: resp => this.clientes = resp.data,
      error: err => console.error('Error cargando clientes', err)
    });
  }

  onCreate() {
    if (this.createForm.invalid) return;
    this.clienteService.createCliente(this.createForm.value).subscribe({
      next: () => {
        this.createForm.reset();
        this.loadClientes();
      },
      error: err => console.error('Error creando cliente', err)
    });
  }

  startEdit(c: ClienteDTO) {
    this.editingDni = c.dni;
    this.editForm.setValue({
      dni: c.dni,
      nombre: c.nombre,
      email: c.email || '',
      direccion: c.direccion || '',
      telefono: c.telefono || ''
    });
  }

  cancelEdit() {
    this.editingDni = null;
    this.editForm.reset();
  }

  saveEdit() {
    if (!this.editingDni || this.editForm.invalid) return;
    const cambios = this.editForm.getRawValue();
    this.clienteService.patchCliente(this.editingDni, cambios).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadClientes();
      },
      error: err => console.error('Error actualizando cliente', err)
    });
  }

  deleteCliente(dni: string) {
    this.clienteService.deleteCliente(dni).subscribe({
      next: () => this.loadClientes(),
      error: err => console.error('Error eliminando cliente', err)
    });
  }
}
