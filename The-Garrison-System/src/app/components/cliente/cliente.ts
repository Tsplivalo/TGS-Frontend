import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClienteService } from '../../services/cliente/cliente';
import { ApiResponse, ClienteDTO } from '../../models/cliente/cliente.model';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.scss']
})
export class ClienteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(ClienteService);

  loading = signal(false);
  error   = signal<string | null>(null);

  clientes = signal<ClienteDTO[]>([]);
  editDni  = signal<string | null>(null);

  fTexto = '';
  fCompras: 'todos' | 'si' | 'no' = 'todos';

  clientesFiltrados = computed(() => {
    const txt = (this.fTexto || '').toLowerCase().trim();
    const filtro = this.fCompras;

    return this.clientes().filter(c => {
      const matchTxt = !txt
        || c.dni.toLowerCase().includes(txt)
        || c.nombre.toLowerCase().includes(txt)
        || (c.email ?? '').toLowerCase().includes(txt)
        || (c.direccion ?? '').toLowerCase().includes(txt)
        || (c.telefono ?? '').toLowerCase().includes(txt);

      const cant = c.regCompras?.length ?? 0;
      const matchCompras = filtro === 'todos'
        || (filtro === 'si' && cant > 0)
        || (filtro === 'no' && cant === 0);

      return matchTxt && matchCompras;
    });
  });

  form = this.fb.group({
    dni:        ['', [Validators.required, Validators.minLength(6)]],
    nombre:     ['', [Validators.required, Validators.minLength(2)]],
    email:      ['', [Validators.email]],
    direccion:  [''],
    telefono:   [''],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllClientes().subscribe({
      next: (r: ApiResponse<ClienteDTO[]>) => {
        this.clientes.set(r.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los clientes.');
        this.loading.set(false);
      }
    });
  }

  nuevo() {
    this.editDni.set(null);
    this.form.reset({ dni: '', nombre: '', email: '', direccion: '', telefono: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editar(c: ClienteDTO) {
    this.editDni.set(c.dni);
    this.form.patchValue({
      dni: c.dni,
      nombre: c.nombre,
      email: c.email ?? '',
      direccion: c.direccion ?? '',
      telefono: c.telefono ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminar(dni: string) {
    if (!confirm('¿Eliminar este cliente?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteCliente(dni).subscribe({
      next: () => this.cargar(),
      error: () => { this.error.set('No se pudo eliminar.'); this.loading.set(false); }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: ClienteDTO = {
      dni: value.dni!.trim(),
      nombre: value.nombre!.trim(),
      email: (value.email ?? '').trim() || undefined,
      direccion: (value.direccion ?? '').trim() || undefined,
      telefono: (value.telefono ?? '').trim() || undefined,
      regCompras: []
    };

    this.loading.set(true);
    this.error.set(null);

    const isEdit = this.editDni() !== null;
    const req$ = isEdit
      ? this.srv.updateCliente(this.editDni()!, body)
      : this.srv.createCliente(body);

    req$.subscribe({
      next: () => {
        this.nuevo();
        this.cargar();
      },
      error: (err) => {
        const msg = err?.error?.message || (isEdit
          ? 'No se pudo guardar.'
          : 'No se pudo crear.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
