import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClienteService } from '../../services/cliente/cliente';
import { ApiResponse } from '../../models/cliente/cliente.model';

// Si no tenés exportado el modelo, podés dejar estos aquí o importarlos:
export interface ClienteDTO {
  dni: string;
  nombre: string;
  email?: string;
  direccion?: string;
  telefono?: string;
  regCompras: any[]; // VentaDTO[] si lo tenés tipado
}
export type CreateClienteDTO = Omit<ClienteDTO, 'regCompras'>;
export type UpdateClienteDTO = Partial<CreateClienteDTO>;

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

  // estado
  loading = signal(false);
  error = signal<string | null>(null);
  editDni = signal<string | null>(null);

  // datos
  clientes = signal<ClienteDTO[]>([]);

  // filtros
  fTexto = signal('');
  fConCompras = signal<'todos' | 'si' | 'no'>('todos');

  // lista filtrada
  listaFiltrada = computed(() => {
    const txt = this.fTexto().toLowerCase().trim();
    const filtroCompras = this.fConCompras();

    return this.clientes().filter(c => {
      const matchTxt =
        !txt ||
        c.dni.toLowerCase().includes(txt) ||
        c.nombre.toLowerCase().includes(txt) ||
        (c.email ?? '').toLowerCase().includes(txt) ||
        (c.telefono ?? '').toLowerCase().includes(txt) ||
        (c.direccion ?? '').toLowerCase().includes(txt);

      const cant = c.regCompras?.length ?? 0;
      const matchCompras =
        filtroCompras === 'todos' ||
        (filtroCompras === 'si' && cant > 0) ||
        (filtroCompras === 'no' && cant === 0);

      return matchTxt && matchCompras;
    });
  });

  // formulario
  form = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(6)]],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    direccion: [''],
    telefono: [''],
  });

  ngOnInit() { this.cargar(); }

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
      telefono: c.telefono ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const dto: CreateClienteDTO = {
      dni: String(v.dni),
      nombre: String(v.nombre),
      email: (v.email ?? '').toString() || undefined,
      direccion: (v.direccion ?? '').toString() || undefined,
      telefono: (v.telefono ?? '').toString() || undefined,
    };

    this.loading.set(true);
    this.error.set(null);

    const dni = this.editDni();
    const obs = dni == null
      ? (this.srv as any).createCliente(dto)                 // ajustá nombre si difiere
      : (this.srv as any).updateCliente(dni, dto as UpdateClienteDTO);

    if (!obs || typeof (obs.subscribe) !== 'function') {
      // Si aún no implementaste create/update en el service, evitamos romper:
      this.error.set('Falta implementar create/update en ClienteService.');
      this.loading.set(false);
      return;
    }

    obs.subscribe({
      next: () => { this.nuevo(); this.cargar(); },
      error: () => { this.error.set('No se pudo guardar.'); this.loading.set(false); }
    });
  }

  eliminar(dni: string) {
    if (!confirm('¿Eliminar cliente?')) return;
    this.loading.set(true);
    this.error.set(null);

    const obs = (this.srv as any).deleteCliente?.(dni);
    if (!obs) {
      this.error.set('Falta implementar delete en ClienteService.');
      this.loading.set(false);
      return;
    }
    obs.subscribe({
      next: () => this.cargar(),
      error: () => { this.error.set('No se pudo eliminar.'); this.loading.set(false); }
    });
  }
}
