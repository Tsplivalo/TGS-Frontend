import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { SobornoService } from '../../services/soborno/soborno';
import { SobornoDTO, CreateSobornoDTO, UpdateSobornoDTO } from '../../models/soborno/soborno.model';
import { VentaService } from '../../services/venta/venta';
import { AutoridadService } from '../../services/autoridad/autoridad';
import { VentaDTO } from '../../models/venta/venta.model';
import { AutoridadDTO } from '../../models/autoridad/autoridad.model';

type SobornoForm = {
  id: FormControl<number | null>;
  autoridadDni: FormControl<string | null>;
  ventaId: FormControl<number | null>;
  monto: FormControl<number | null>;
  pagado: FormControl<boolean>;
};

@Component({
  selector: 'app-soborno',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './soborno.html',
  styleUrls: ['./soborno.scss'],
})
export class SobornoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(SobornoService);
  private ventaSrv = inject(VentaService);
  private autoridadSrv = inject(AutoridadService);

  sobornos = signal<SobornoDTO[]>([]);
  ventas = signal<VentaDTO[]>([]);
  autoridades = signal<AutoridadDTO[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);
  filtroText = '';

  form: FormGroup<SobornoForm> = this.fb.group<SobornoForm>({
    id: this.fb.control<number | null>(null),
    autoridadDni: this.fb.control<string | null>(null, { validators: [Validators.required] }),
    ventaId: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    monto: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    pagado: this.fb.nonNullable.control(false),
  });

  get isEditing(): boolean { return !!this.form.controls.id.value; }

  ngOnInit(): void {
    this.cargarSobornos();
    this.cargarVentas();
    this.cargarAutoridades();
  }

  cargarSobornos() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (res: any) => {
        const lista = (res?.sobornos ?? res?.data ?? []) as SobornoDTO[];
        this.sobornos.set(lista);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudieron cargar los sobornos.');
        this.loading.set(false);
      }
    });
  }

  cargarVentas() {
    this.ventaSrv.getAllVentas().subscribe({
      next: (res: any) => {
        const lista = (res?.ventas ?? res?.data ?? []) as VentaDTO[];
        this.ventas.set(lista);
      },
      error: (err) => console.warn('[SOBORNO] No pude cargar ventas:', err)
    });
  }

  cargarAutoridades() {
    this.autoridadSrv.getAllAutoridades().subscribe({
      next: (res: any) => {
        const lista = (res?.autoridades ?? res?.data ?? []) as AutoridadDTO[];
        this.autoridades.set(lista);
      },
      error: (err) => console.warn('[SOBORNO] No pude cargar autoridades:', err)
    });
  }

  filtrados = computed(() => {
    const q = (this.filtroText || '').toLowerCase().trim();
    if (!q) return this.sobornos();
    return this.sobornos().filter(s =>
      String(s.id ?? '').includes(q) ||
      String((s.venta?.id ?? s.ventaId) ?? '').includes(q) ||
      (s.autoridadDni ?? '').toLowerCase().includes(q)
    );
  });

  nuevo() {
    this.form.reset({ id: null, autoridadDni: null, ventaId: null, monto: null, pagado: false });
    this.error.set(null);
  }

  editar(s: SobornoDTO) {
    this.form.setValue({
      id: s.id ?? null,
      autoridadDni: s.autoridadDni ?? null,
      ventaId: (s.venta?.id ?? s.ventaId ?? null) as number | null,
      monto: (s.monto ?? null) as number | null,
      pagado: !!s.pagado,
    });
    this.error.set(null);
  }

  eliminar(id?: number | null) {
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => this.cargarSobornos(),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo eliminar.');
        this.loading.set(false);
      }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completá todos los campos.');
      return;
    }

    const id = this.form.controls.id.value;

    const body = {
      autoridadDni: String(this.form.controls.autoridadDni.value),
      ventaId: Number(this.form.controls.ventaId.value),
      monto: Number(this.form.controls.monto.value),
      pagado: !!this.form.controls.pagado.value,
    } as CreateSobornoDTO & UpdateSobornoDTO;

    this.loading.set(true);
    this.error.set(null);

    const obs = id
      ? this.srv.update(id, body)
      : this.srv.create(body as CreateSobornoDTO);

    obs.subscribe({
      next: () => { this.nuevo(); this.cargarSobornos(); },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo guardar.');
        this.loading.set(false);
      }
    });
  }

  marcarPagado(s: SobornoDTO) {
    if (!s.id) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.update(s.id, { pagado: true }).subscribe({
      next: () => this.cargarSobornos(),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo marcar como pagado.');
        this.loading.set(false);
      }
    });
  }
}
