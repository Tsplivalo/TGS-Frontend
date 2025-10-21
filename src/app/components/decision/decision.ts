import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { DecisionService } from '../../services/decision/decision';
import { DecisionDTO, CreateDecisionDTO, PatchDecisionDTO } from '../../models/decision/decision.model';
import { TopicService } from '../../services/topic/topic';
import { TopicDTO } from '../../models/topic/topic.model';

/**
 * DecisionComponent
 *
 * Administra decisiones con filtro por texto y tema, validación de fechas (hoy en adelante)
 * y guardado como CREATE (POST) o UPDATE parcial (PATCH). Comentarios enfocados en decisiones
 * de diseño, validaciones y construcción de payloads.
 */

type DecisionForm = {
  id: FormControl<number | null>;
  topicId: FormControl<number | null>;
  description: FormControl<string>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
};

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './decision.html',
  styleUrls: ['./decision.scss'],
})
export class DecisionComponent implements OnInit {
  // --- Inyección ---
  private fb = inject(FormBuilder);
  private srv = inject(DecisionService);
  private topicSrv = inject(TopicService);

  // --- Estado (signals) ---
  decisions = signal<DecisionDTO[]>([]);
  topics = signal<TopicDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);
  isEdit = signal(false);

  // --- Filtros del listado ---
  fTextInput = signal('');
  fTextApplied = signal('');
  topicFilterInput = signal('');
  topicFilterApplied = signal('');
  today = this.todayLocalInput(); // AAAA-MM-DD para inputs tipo date

  // --- Form reactivo ---
  form: FormGroup<DecisionForm> = this.fb.group<DecisionForm>({
    id: this.fb.control<number | null>(null),
    topicId: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    description: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(1)] }),
    startDate: this.fb.nonNullable.control(this.today, { validators: [Validators.required] }),
    endDate: this.fb.nonNullable.control(this.today, { validators: [Validators.required] }),
  });

  // --- UI: abrir/cerrar formulario ---
  isFormOpen = false;
  toggleForm(){ this.isFormOpen = !this.isFormOpen; }

  // --- Ciclo de vida ---
  ngOnInit(): void {
    // Normaliza topicId si llega como string desde el template (selects)
    this.form.controls.topicId.valueChanges.subscribe((v) => {
      if (typeof v === 'string' && v !== '') {
        const n = Number(v);
        if (!Number.isNaN(n)) this.form.controls.topicId.setValue(n, { emitEvent: false });
      }
    });

    // Reglas de fechas: start >= hoy y end >= start
    this.form.controls.startDate.valueChanges.subscribe((v) => {
      if (v && v < this.today) this.form.controls.startDate.setValue(this.today, { emitEvent: false });
      if (this.form.controls.endDate.value && this.form.controls.endDate.value < (this.form.controls.startDate.value || '')) {
        this.form.controls.endDate.setValue(this.form.controls.startDate.value!, { emitEvent: false });
      }
    });
    this.form.controls.endDate.valueChanges.subscribe((v) => {
      const fi = this.form.controls.startDate.value || this.today;
      if (v && v < fi) this.form.controls.endDate.setValue(fi, { emitEvent: false });
    });

    this.load();
    this.loadTopics();
  }

  // Fecha local en formato input date (AAAA-MM-DD)
  private todayLocalInput(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ✅ NUEVO: Convierte fecha YYYY-MM-DD a formato ISO con hora del mediodía UTC
  // Esto evita problemas de timezone al enviar al backend
  private dateToISO(dateStr: string): string {
    if (!dateStr) return '';
    // Agregar hora del mediodía UTC para evitar cambios de día por timezone
    return `${dateStr}T12:00:00.000Z`;
  }

  // ✅ NUEVO: Formatea fecha ISO a DD/MM/YYYY para mostrar
  formatDateDDMMYYYY(isoDate: string | undefined): string {
    if (!isoDate) return '—';
    
    // Extraer solo la parte de la fecha (YYYY-MM-DD)
    const dateOnly = isoDate.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    
    return `${day}/${month}/${year}`;
  }

  // --- Listados filtrados ---
  filteredDecisions = computed(() => {
  const q = this.fTextApplied().toLowerCase().trim();
  const tFilter = this.topicFilterApplied().trim();
  
  return this.decisions().filter(d => {
    // Filtro por texto en descripción o ID
    const matchText = !q || 
      (d.description || '').toLowerCase().includes(q) || 
      String(d.id).includes(q);
    
    // Filtro por tema específico
    const topicId = d.topic?.id != null ? String(d.topic.id) : '';
    const matchTopic = !tFilter || topicId === tFilter;
    
    return matchText && matchTopic;
  });
});

  applyFilters() {
  this.fTextApplied.set(this.fTextInput());
  this.topicFilterApplied.set(this.topicFilterInput());
  }

  clearFilters() {
    this.fTextInput.set('');
    this.topicFilterInput.set('');
    this.fTextApplied.set('');
    this.topicFilterApplied.set('');
  }

  totalDecisions = computed(() => this.decisions().length);
  activeDecisions = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.decisions().filter(d => d.endDate >= today).length;
  });
  // --- Data fetching ---
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (list: DecisionDTO[]) => { this.decisions.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message || 'Could not load decisions.'); this.loading.set(false); }
    });
  }

  loadTopics() {
    this.topicSrv.getAll().subscribe({
      next: (list: TopicDTO[]) => { this.topics.set(list); },
      error: () => {}
    });
  }

  // --- Crear / Editar ---
  new() {
    this.isEdit.set(false);
    this.form.reset({ id: null, topicId: null, description: '', startDate: this.today, endDate: this.today });
    this.submitted.set(false);
    this.error.set(null);
  }

  edit(d: DecisionDTO) {
    this.isEdit.set(true);
    this.form.setValue({
      id: d.id,
      topicId: d.topic?.id ?? null,
      description: d.description || '',
      startDate: (d.startDate || '').slice(0, 10),
      endDate: (d.endDate || '').slice(0, 10),
    });
    this.submitted.set(false);
    this.error.set(null);
  }

  delete(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => { this.error.set(err?.error?.message || 'Could not delete.'); this.loading.set(false); }
    });
  }

  // --- Builders de payload ---
  private buildCreate(): CreateDecisionDTO {
    const v = this.form.getRawValue();
    return {
      topicId: Number(v.topicId),
      description: String(v.description).trim(),
      startDate: this.dateToISO(v.startDate), // ✅ Convertir a ISO
      endDate: this.dateToISO(v.endDate),     // ✅ Convertir a ISO
    };
  }

  private buildPatch(): PatchDecisionDTO {
    const v = this.form.getRawValue();
    return {
      topicId: v.topicId != null ? Number(v.topicId) : undefined,
      description: v.description?.trim() || undefined,
      startDate: v.startDate ? this.dateToISO(v.startDate) : undefined, // ✅ Convertir a ISO
      endDate: v.endDate ? this.dateToISO(v.endDate) : undefined,       // ✅ Convertir a ISO
    };
  }

  // Regla simple: start >= hoy y end >= start
  private areDatesValid(): boolean {
    const fi = this.form.controls.startDate.value || '';
    const ff = this.form.controls.endDate.value || '';
    return !!fi && !!ff && ff >= fi && fi >= this.today;
  }

  // --- Guardar ---
  save() {
    this.submitted.set(true);

    // Normaliza topicId vacío a null para que falle la validación requerida
    const t = this.form.controls.topicId.value;
    if ((t as any) === '') this.form.controls.topicId.setValue(null);

    const baseInvalid = this.form.invalid;
    const datesInvalid = !this.areDatesValid();

    if (baseInvalid || datesInvalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // CREATE
    if (!this.isEdit()) {
      const payload = this.buildCreate();
      console.log('📤 CREATE Payload:', payload); // Debug
      this.srv.create(payload).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => {
          const raw = err?.error; const msg = raw?.message || (typeof raw === 'string' ? raw : 'Could not create.');
          this.error.set(msg); this.loading.set(false);
        }
      });
      return;
    }

    // UPDATE (PATCH parcial)
    const id = this.form.controls.id.value!;
    const payload = this.buildPatch();
    console.log('📤 UPDATE Payload:', payload); // Debug
    this.srv.update(id, payload).subscribe({
      next: () => { this.new(); this.load(); },
      error: (err) => {
        const raw = err?.error; const msg = raw?.message || (typeof raw === 'string' ? raw : 'Could not save.');
        this.error.set(msg); this.loading.set(false);
      }
    });
  }
}