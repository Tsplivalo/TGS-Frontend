import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, Validators, FormGroup, FormControl
} from '@angular/forms';

import { DecisionService } from '../../services/decision/decision';
import {
  DecisionDTO, CreateDecisionDTO, PatchDecisionDTO, ApiResponse as ApiDecisionResp
} from '../../models/decision/decision.model';

import { TematicaService } from '../../services/tematica/tematica';
import { TematicaDTO, ApiResponse as ApiTemResp } from '../../models/tematica/tematica.model';

type DecisionForm = {
  id: FormControl<number | null>;
  tematicaId: FormControl<number | null>;
  descripcion: FormControl<string>;
  fechaInicio: FormControl<string>; // yyyy-MM-dd
  fechaFin: FormControl<string>;    // yyyy-MM-dd
};

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './decision.html',
  styleUrls: ['./decision.scss'],
})
export class DecisionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(DecisionService);
  private temSrv = inject(TematicaService);

  decisiones = signal<DecisionDTO[]>([]);
  tematicas = signal<TematicaDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);
  isEdit = signal(false);

  // filtros
  fTexto = '';
  filtroTematica = '';

  // hoy en formato input date
  today = this.todayLocalInput();

  form: FormGroup<DecisionForm> = this.fb.group<DecisionForm>({
    id: this.fb.control<number | null>(null),
    tematicaId: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    descripcion: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(1)] }),
    fechaInicio: this.fb.nonNullable.control(this.today, { validators: [Validators.required] }),
    fechaFin: this.fb.nonNullable.control(this.today, { validators: [Validators.required] }),
  });

  ngOnInit(): void {
    // Si el <select> de temáticas llegara a emitir string, lo convierto a number
    this.form.controls.tematicaId.valueChanges.subscribe((v) => {
      if (typeof v === 'string' && v !== '') {
        const n = Number(v);
        if (!Number.isNaN(n)) this.form.controls.tematicaId.setValue(n, { emitEvent: false });
      }
    });

    // Enforce min hoy: si alguien pisa manualmente, lo corrijo
    this.form.controls.fechaInicio.valueChanges.subscribe((v) => {
      if (v && v < this.today) this.form.controls.fechaInicio.setValue(this.today, { emitEvent: false });
      // si fechaFin quedó antes de inicio, la ajusto
      if (this.form.controls.fechaFin.value && this.form.controls.fechaFin.value < (this.form.controls.fechaInicio.value || '')) {
        this.form.controls.fechaFin.setValue(this.form.controls.fechaInicio.value!, { emitEvent: false });
      }
    });
    this.form.controls.fechaFin.valueChanges.subscribe((v) => {
      const fi = this.form.controls.fechaInicio.value || this.today;
      if (v && v < fi) this.form.controls.fechaFin.setValue(fi, { emitEvent: false });
    });

    this.cargar();
    this.cargarTematicas();
  }

  // ===== Utils =====
  private todayLocalInput(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  decisionesFiltradas = computed(() => {
    const q = (this.fTexto || '').toLowerCase().trim();
    const tFilter = (this.filtroTematica || '').trim();
    return this.decisiones().filter(d => {
      const matchTxt = !q || (d.descripcion || '').toLowerCase().includes(q) || String(d.id).includes(q);
      const temId = d.tematica?.id != null ? String(d.tematica.id) : '';
      const matchTem = !tFilter || temId === tFilter;
      return matchTxt && matchTem;
    });
  });

  tematicasFiltradas = computed(() => {
    const q = (this.filtroTematica || '').toLowerCase().trim();
    if (!q) return this.tematicas();
    return this.tematicas().filter(t =>
      (t.descripcion || '').toLowerCase().includes(q) ||
      String(t.id).includes(q)
    );
  });

  // ===== Data =====
  cargar() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (res: ApiDecisionResp<DecisionDTO[]>) => {
        this.decisiones.set(res?.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudieron cargar las decisiones.');
        this.loading.set(false);
      }
    });
  }

  cargarTematicas() {
    this.temSrv.getAll().subscribe({
      next: (res: ApiTemResp<TematicaDTO[]>) => {
        this.tematicas.set(res?.data || []);
      },
      error: (err) => console.warn('[DECISION] No pude cargar temáticas:', err)
    });
  }

  // ===== CRUD UI =====
  nuevo() {
    this.isEdit.set(false);
    this.form.reset({
      id: null,
      tematicaId: null,
      descripcion: '',
      fechaInicio: this.today,
      fechaFin: this.today,
    });
    this.submitted.set(false);
    this.error.set(null);
  }

  editar(d: DecisionDTO) {
    this.isEdit.set(true);
    this.form.setValue({
      id: d.id,
      tematicaId: d.tematica?.id ?? null,
      descripcion: d.descripcion || '',
      fechaInicio: (d.fechaInicio || '').slice(0, 10),
      fechaFin: (d.fechaFin || '').slice(0, 10),
    });
    this.submitted.set(false);
    this.error.set(null);
  }

  eliminar(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo eliminar (revisá la ruta en el backend).');
        this.loading.set(false);
      }
    });
  }

  // ===== Builders =====
  private buildCreate(): CreateDecisionDTO {
    const v = this.form.getRawValue();
    return {
      tematicaId: Number(v.tematicaId),
      descripcion: String(v.descripcion).trim(),
      fechaInicio: String(v.fechaInicio),
      fechaFin: String(v.fechaFin),
    };
  }

  private buildPatch(): PatchDecisionDTO {
    const v = this.form.getRawValue();
    return {
      tematicaId: v.tematicaId != null ? Number(v.tematicaId) : undefined,
      descripcion: v.descripcion?.trim() || undefined,
      fechaInicio: v.fechaInicio || undefined,
      fechaFin: v.fechaFin || undefined,
    };
  }

  private fechasValidas(): boolean {
    const fi = this.form.controls.fechaInicio.value || '';
    const ff = this.form.controls.fechaFin.value || '';
    // ya están acotadas por min y subs, pero validamos igual
    return !!fi && !!ff && ff >= fi && fi >= this.today;
  }

  guardar() {
    this.submitted.set(true);

    // Normalizo select vacío
    const t = this.form.controls.tematicaId.value;
    if ((t as any) === '') this.form.controls.tematicaId.setValue(null);

    const invalidBase = this.form.invalid;
    const invalidFechas = !this.fechasValidas();

    if (invalidBase || invalidFechas) {
      this.form.markAllAsTouched();
      const msgs: string[] = [];
      if (this.form.controls.tematicaId.invalid) msgs.push('Temática');
      if (this.form.controls.descripcion.invalid) msgs.push('Descripción');
      if (invalidFechas) msgs.push('Fechas (inicio ≥ hoy y fin ≥ inicio)');
      this.error.set(`Completá correctamente: ${msgs.join(', ')}.`);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!this.isEdit()) {
      // CREAR
      const payload = this.buildCreate();
      this.srv.create(payload).subscribe({
        next: () => { this.nuevo(); this.cargar(); },
        error: (err) => {
          const raw = err?.error;
          const msg = raw?.message || (typeof raw === 'string' ? raw : 'No se pudo crear.');
          this.error.set(msg);
          this.loading.set(false);
        }
      });
      return;
    }

    // EDITAR (PATCH)
    const id = this.form.controls.id.value!;
    const payload = this.buildPatch();
    this.srv.update(id, payload).subscribe({
      next: () => { this.nuevo(); this.cargar(); },
      error: (err) => {
        const raw = err?.error;
        const msg = raw?.message || (typeof raw === 'string' ? raw : 'No se pudo guardar.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
