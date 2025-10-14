import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MonthlyReviewService } from '../../services/monthly-review/monthly-review';
import {
  MonthlyReviewDTO,
  CreateMonthlyReviewDTO,
  PatchMonthlyReviewDTO,
  SalesStatsItem
} from '../../models/monthly-review/monthly-review.model';

/**
 * Componente: MonthlyReview
 *
 * - Presenta un listado de revisiones mensuales con filtros por año/mes.
 * - Muestra estadísticas agregadas (por producto) para el período filtrado.
 * - Incluye formulario de crear/editar (manejado externamente con un panel colapsable en el HTML).
 * - Estado 100% reactivo usando Signals (items, stats, loading, error, etc.).
 *
 * Notas:
 * - Este componente es standalone y declara sus imports.
 * - La persistencia se hace vía MonthlyReviewService (HTTP).
 */
@Component({
  selector: 'app-monthly-review',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './monthly-review.html',
  styleUrls: ['./monthly-review.scss'],
})
export class MonthlyReviewComponent implements OnInit {
  // ─────────────────────────────────────────────────────────────────────────────
  // Inyección de dependencias
  // ─────────────────────────────────────────────────────────────────────────────
  private fb  = inject(FormBuilder);
  private srv = inject(MonthlyReviewService);
  private tr  = inject(TranslateService);

  // ─────────────────────────────────────────────────────────────────────────────
  // Estado base (Signals)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Lista de revisiones cargadas desde backend. */
  items   = signal<MonthlyReviewDTO[]>([]);

  /** Estadísticas agregadas (por producto) en el período filtrado. */
  stats   = signal<SalesStatsItem[]>([]);

  /** Bandera de carga para deshabilitar acciones y mostrar “Cargando…”. */
  loading = signal(false);

  /** Último mensaje de error (o null si no hay error). */
  error   = signal<string | null>(null);

  /** Controla la visibilidad del panel crear/editar (colapsable en la vista). */
  isNewOpen = signal(false);

  /** `true` cuando se está editando un registro existente. */
  isEdit    = signal(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Filtros de vista
  // ─────────────────────────────────────────────────────────────────────────────

  /** Año seleccionado para filtrar (por defecto, el año actual). */
  fYear  = signal<number>(new Date().getFullYear());

  /** Mes seleccionado (1-12) o null para “todos”. */
  fMonth = signal<number | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Formulario reactivo
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * FormGroup de crear/editar.
   * - reviewedByDni: DNI del socio revisor (requerido, min 6).
   * - year/month: período de la revisión (con validaciones mínimas).
   * - reviewDate: fecha ISO (yyyy-MM-dd) apta para <input type="date">.
   * - status: enum de estado (PENDING por defecto).
   * - observations/recommendations: campos de texto libres.
   */
  form = this.fb.group({
    id: this.fb.control<number | null>(null),
    reviewedByDni: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    year:  this.fb.nonNullable.control(new Date().getFullYear(), [Validators.required, Validators.min(2000)]),
    month: this.fb.nonNullable.control(new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]),
    reviewDate: this.fb.control<string | null>(null),
    status: this.fb.control<'PENDING'|'IN_REVIEW'|'COMPLETED'|'APPROVED'|'REJECTED' | null>('PENDING'),
    observations: this.fb.control<string | null>(null),
    recommendations: this.fb.control<string | null>(null),
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────────────────────────────────────

  /** Al iniciar: cargar listado y estadísticas del período por defecto. */
  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Derivados (computed)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lista filtrada por año/mes.
   * Si `fMonth` es null, no filtra por mes.
   */
  filtered = computed(() => {
    const y = this.fYear();
    const m = this.fMonth();
    return this.items().filter(it => (y ? it.year === y : true) && (m ? it.month === m : true));
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Acciones de UI
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Alterna la apertura del panel crear/editar.
   * Si se cierra, resetea el formulario (modo “nuevo”).
   */
  toggleNew(): void {
    const open = !this.isNewOpen();
    this.isNewOpen.set(open);
    if (!open) this.new();
  }

  /**
   * Limpia el formulario a valores por defecto y pone el modo en “crear”.
   */
  new(): void {
    this.isEdit.set(false);
    this.form.reset({
      id: null,
      reviewedByDni: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      reviewDate: null,
      status: 'PENDING',
      observations: null,
      recommendations: null,
    });
  }

  /**
   * Carga en el formulario los datos del registro a editar y abre el panel.
   */
  edit(it: MonthlyReviewDTO): void {
    this.isEdit.set(true);
    this.form.patchValue({
      id: it.id,
      reviewedByDni: it.reviewedBy?.dni ?? '',
      year: it.year,
      month: it.month,
      reviewDate: it.reviewDate?.substring(0, 10) ?? null,
      status: it.status,
      observations: it.observations ?? null,
      recommendations: it.recommendations ?? null,
    });
    this.isNewOpen.set(true);
  }

  /**
   * Guarda el formulario:
   * - si `isEdit` es false → crea;
   * - si `isEdit` es true  → actualiza.
   * Maneja loading, errores y refresco de lista/estadísticas.
   */
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { id, ...rest } = this.form.getRawValue();

    if (!this.isEdit()) {
      const payload = rest as CreateMonthlyReviewDTO;
      this.srv.create(payload).subscribe({
        next: () => {
          this.new();
          this.isNewOpen.set(false);
          this.load();
          this.loadStats();
        },
        error: (e) => {
          this.error.set(e?.error?.message ?? (this.tr.instant('monthlyReview.errorCreate') || 'Error creando'));
          this.loading.set(false);
        }
      });
    } else {
      const payload = rest as PatchMonthlyReviewDTO;
      this.srv.update(id!, payload).subscribe({
        next: () => {
          this.new();
          this.isNewOpen.set(false);
          this.load();
          this.loadStats();
        },
        error: (e) => {
          this.error.set(e?.error?.message ?? (this.tr.instant('monthlyReview.errorSave') || 'Error guardando'));
          this.loading.set(false);
        }
      });
    }
  }

  /**
   * Elimina una revisión tras confirmar. Luego recarga listado y estadísticas.
   */
  delete(it: MonthlyReviewDTO): void {
    const msg = this.tr.instant('monthlyReview.confirmDelete') || '¿Eliminar revisión?';
    if (!confirm(msg)) return;

    this.srv.delete(it.id).subscribe({
      next: () => { this.load(); this.loadStats(); },
      error: (e) => {
        this.error.set(e?.error?.message ?? (this.tr.instant('monthlyReview.errorDelete') || 'No se pudo eliminar.'));
      }
    });
  }

  /**
   * trackBy para *ngFor: mejora rendimiento usando el id como identidad.
   */
  trackById = (_: number, it: MonthlyReviewDTO) => it.id;

  // ─────────────────────────────────────────────────────────────────────────────
  // Carga de datos
  // ─────────────────────────────────────────────────────────────────────────────

  /** Carga el listado completo desde el servicio. */
  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.srv.list().subscribe({
      next: (list: MonthlyReviewDTO[]) => {
        this.items.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: (e: any) => {
        this.error.set(e?.error?.message ?? 'Error cargando');
        this.loading.set(false);
      }
    });
  }

  /**
   * Carga estadísticas para el período actual de filtros.
   * `m` puede ser undefined para “todos los meses” del año.
   */
  loadStats(): void {
    const y = this.fYear();
    const m = this.fMonth() ?? undefined;

    this.srv.stats(y, m, 'product').subscribe({
      next: (arr: SalesStatsItem[]) => this.stats.set(Array.isArray(arr) ? arr : []),
      error: (_e: any) => {}
    });
}
}
