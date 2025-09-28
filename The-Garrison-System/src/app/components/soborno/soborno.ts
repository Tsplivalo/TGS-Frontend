import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { SobornoService } from '../../services/soborno/soborno';
import { SobornoDTO, CreateSobornoDTO, UpdateSobornoDTO } from '../../models/soborno/soborno.model';
import { VentaService } from '../../services/venta/venta';
import { AutoridadService } from '../../services/autoridad/autoridad';
import { VentaDTO } from '../../models/venta/venta.model';
import { AutoridadDTO } from '../../models/autoridad/autoridad.model';
import { GlassPanelComponent } from '../../shared/ui/glass-panel/glass-panel.component.js';

type SobornoForm = {
  id: FormControl<number | null>;
  autoridadId: FormControl<string | number | null>;
  ventaId: FormControl<number | null>;
  monto: FormControl<number | null>;
  pagado: FormControl<boolean>;
};

@Component({
  selector: 'app-soborno',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, GlassPanelComponent],
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
    autoridadId: this.fb.control<string | number | null>(null, { validators: [Validators.required] }),
    ventaId: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    monto: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    pagado: this.fb.nonNullable.control(false),
  });

  get isEditing(): boolean { return !!this.form.controls.id.value; }

  ngOnInit(): void {
    this.cargarSobornos();
    this.cargarVentas();
    this.cargarAutoridades();
    this.setEditMode(false);
  }

  private setEditMode(isEdit: boolean) {
    const cfg = (ctrl: FormControl<any>, validators: any[]) => {
      ctrl.clearValidators();
      if (!isEdit) ctrl.setValidators(validators); // requeridos solo al crear
      ctrl.updateValueAndValidity({ emitEvent: false });
    };
    cfg(this.form.controls.autoridadId, [Validators.required]);
    cfg(this.form.controls.ventaId, [Validators.required, Validators.min(1)]);
    cfg(this.form.controls.monto, [Validators.required, Validators.min(0)]);
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
      String(s.autoridad?.id ?? s.autoridadId ?? '').includes(q)
    );
  });

  nuevo() {
    this.form.reset({ id: null, autoridadId: null, ventaId: null, monto: null, pagado: false });
    this.setEditMode(false);
    this.form.markAsPristine();
    this.error.set(null);
  }

  editar(s: SobornoDTO) {
    this.form.reset();
    this.form.patchValue({
      id: s.id ?? null,
      autoridadId: (s.autoridad?.id ?? s.autoridadId ?? null) as any,
      ventaId: (s.venta?.id ?? s.ventaId ?? null) as number | null,
      monto: (s.monto ?? null) as number | null,
      pagado: !!s.pagado,
    });
    this.setEditMode(true);
    this.form.markAsPristine();
    this.error.set(null);
  }

  guardar() {
    const id = this.form.controls.id.value;

    if (!id) {
      // === CREAR ===
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.error.set('Completá todos los campos.');
        return;
      }
      const body: CreateSobornoDTO = {
        monto: Number(this.form.controls.monto.value),
        autoridadId: String(this.form.controls.autoridadId.value!),
        ventaId: Number(this.form.controls.ventaId.value!),
        pagado: !!this.form.controls.pagado.value,
      };
      this.loading.set(true);
      this.error.set(null);
      this.srv.create(body).subscribe({
        next: () => { this.nuevo(); this.cargarSobornos(); },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudo crear.');
          this.loading.set(false);
        }
      });
      return;
    }

    // === EDITAR (PATCH parcial) ===
    const c = this.form.controls;
    const patch: UpdateSobornoDTO = {};
    if (c.monto.dirty)      patch.monto = Number(c.monto.value);
    if (c.autoridadId.dirty) patch.autoridadId = String(c.autoridadId.value!);
    if (c.ventaId.dirty)    patch.ventaId = Number(c.ventaId.value!);
    if (c.pagado.dirty)     patch.pagado = !!c.pagado.value;

    if (Object.keys(patch).length === 0) {
      this.error.set('No hay cambios para guardar.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.srv.update(id, patch).subscribe({
      next: () => { this.nuevo(); this.cargarSobornos(); },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo actualizar.');
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
