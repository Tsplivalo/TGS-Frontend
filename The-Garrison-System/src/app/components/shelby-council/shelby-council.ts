import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Datos mínimos de un socio (partner) relacionados a un registro del Consejo.
 */
type Partner = { dni: string; name?: string | null };

/**
 * Datos mínimos de una decisión (decision) asociada a un registro del Consejo.
 */
type Decision = { id: number; description?: string | null };

/**
 * DTO principal para filas del Consejo Shelby.
 * Representa lo que mostramos/guardamos desde el formulario y el listado.
 */
export interface ShelbyCouncilDTO {
  id: number;
  partner?: Partner | null;
  decision?: Decision | null;
  /**
   * Fecha en formato ISO (yyyy-MM-dd) apto para <input type="date">
   */
  joinDate: string;
  role: string;
  notes?: string | null;
}

/**
 * Componente: Consejo Shelby
 *
 * - Usa **Signals** para estado reactivo (loading, error, filtros, etc.).
 * - Un **formulario reactivo** para crear/editar registros.
 * - Un **listado filtrable** con trackBy para eficiencia.
 * - Un **colapsable** controlado por `isNewOpen` para abrir/cerrar el panel de edición/alta.
 *
 * Nota: Este componente es **standalone** y declara sus propios imports.
 */
@Component({
  selector: 'app-shelby-council',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './shelby-council.html',
  styleUrls: ['./shelby-council.scss'],
})
export class ShelbyCouncilComponent {
  // Inyección de FormBuilder usando la API de `inject` (Angular v15+)
  private fb = inject(FormBuilder);

  // ─────────────────────────────────────────────────────────────────────────────
  // Estado base (Signals)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Estado de carga para bloquear acciones y mostrar "Cargando..." */
  readonly loading = signal(false);

  /** Último mensaje de error (o null si no hay error) */
  readonly error   = signal<string | null>(null);

  /** Controla si el panel de crear/editar está abierto (colapsable) */
  readonly isNewOpen = signal(false);

  /** ID del registro en edición; si es null, el formulario está en modo "crear" */
  readonly editId    = signal<number | null>(null);

  /** Texto de filtro libre aplicado al listado */
  readonly fText = signal<string>('');

  // ─────────────────────────────────────────────────────────────────────────────
  // Datos
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fuente de datos en memoria (ejemplo).
   * Integrá tu servicio real para persistencia (HTTP) y refrescá este signal.
   */
  readonly data = signal<ShelbyCouncilDTO[]>([]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Formulario Reactivo
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * FormGroup con validaciones mínimas.
   * - partnerDni/decisionId/role required
   * - joinDate se setea con `today()` para facilitar el alta.
   */
  readonly form = this.fb.group({
    partnerDni: ['', [Validators.required]],
    decisionId: [null as number | null, [Validators.required]],
    joinDate:   [this.today(), [Validators.required]],
    role:       ['', [Validators.required]],
    notes:      [''],
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Derivados (computed)
  // ─────────────────────────────────────────────────────────────────────────────

  /** `true` si estamos editando un registro existente (editId !== null). */
  readonly isEdit = computed(() => this.editId() !== null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Listado / Filtro
  // ─────────────────────────────────────────────────────────────────────────────

  /** Aplica filtro de texto contra varias columnas combinadas. */
  filtered(): ShelbyCouncilDTO[] {
    const q = (this.fText() || '').toLowerCase().trim();
    if (!q) return this.data();

    return this.data().filter(it => {
      const txt = [
        it.id,
        it.partner?.dni,
        it.partner?.name,
        it.decision?.id,
        it.decision?.description,
        it.role,
      ].join(' ').toLowerCase();
      return txt.includes(q);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Acciones de UI
  // ─────────────────────────────────────────────────────────────────────────────

  /** Abre/cierra el panel de alta/edición (resetea al cerrar). */
  toggleNew(): void {
    const open = !this.isNewOpen();
    this.isNewOpen.set(open);
    if (!open) this.new();
  }

  /** Limpia el formulario y vuelve a modo "crear". */
  new(): void {
    this.editId.set(null);
    this.form.reset({
      partnerDni: '',
      decisionId: null,
      joinDate: this.today(),
      role: '',
      notes: '',
    });
  }

  /** Carga un registro en el formulario y abre el panel en modo edición. */
  edit(it: ShelbyCouncilDTO): void {
    this.editId.set(it.id);

    this.form.patchValue({
      partnerDni: it.partner?.dni ?? '',
      decisionId: it.decision?.id ?? null,
      joinDate: it.joinDate ?? this.today(),
      role: it.role ?? '',
      notes: it.notes ?? '',
    });

    this.isNewOpen.set(true);
  }

  /**
   * Guarda el formulario (in-memory en este ejemplo).
   * En backend real: llamar servicio, manejar errores y loading.
   */
  async save(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.error.set(null);

    try {
      const v = this.form.getRawValue();

      const payload: ShelbyCouncilDTO = {
        id: this.editId() ?? this.nextId(),
        partner:  { dni: v.partnerDni!, name: null },
        decision: { id: Number(v.decisionId), description: null },
        joinDate: v.joinDate!,
        role:     v.role!,
        notes:    v.notes || null,
      };

      if (this.editId() === null) {
        this.data.set([payload, ...this.data()]);
      } else {
        this.data.set(this.data().map(x => (x.id === payload.id ? payload : x)));
      }

      this.isNewOpen.set(false);
      this.new();

    } catch (e: any) {
      this.error.set(e?.message ?? 'No se pudo guardar');
    } finally {
      this.loading.set(false);
    }
  }

  /** Elimina el registro (in-memory). */
  delete(it: ShelbyCouncilDTO): void {
    this.data.set(this.data().filter(x => x.id !== it.id));
  }

  /** trackBy para *ngFor por ID. */
  trackById = (_: number, it: ShelbyCouncilDTO) => it.id;

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers internos
  // ─────────────────────────────────────────────────────────────────────────────

  /** Hoy en formato yyyy-MM-dd. */
  private today(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  /** Próximo ID incremental (sólo para modo in-memory). */
  private nextId(): number {
    const max = this.data().reduce((m, it) => Math.max(m, it.id), 0);
    return max + 1;
  }
}
