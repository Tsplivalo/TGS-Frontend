import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MonthlyReviewService } from '../../services/monthly-review/monthly-review';
import {
  MonthlyReviewDTO,
  CreateMonthlyReviewDTO,
  PatchMonthlyReviewDTO,
  ReviewStatus
} from '../../models/monthly-review/monthly-review.model';

@Component({
  selector: 'app-monthly-review',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './monthly-review.html',
  styleUrls: ['./monthly-review.scss'],
})
export class MonthlyReviewComponent implements OnInit {
  private fb  = inject(FormBuilder);
  private srv = inject(MonthlyReviewService);
  private tr  = inject(TranslateService);

  // Estado
  items   = signal<MonthlyReviewDTO[]>([]);
  statistics = signal<any>(null);
  loading = signal(false);
  error   = signal<string | null>(null);
  isNewOpen = signal(false);
  isEdit    = signal(false);

  // Filtros
  fYear  = signal<number>(new Date().getFullYear());
  fMonth = signal<number | null>(null);
  fStatus = signal<ReviewStatus | null>(null);

  // Formulario
  form = this.fb.group({
    id: this.fb.control<number | null>(null),
    partnerDni: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    year:  this.fb.nonNullable.control(new Date().getFullYear(), [Validators.required, Validators.min(2000)]),
    month: this.fb.nonNullable.control(new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]),
    reviewDate: this.fb.control<string | null>(this.todayISO()),
    status: this.fb.control<ReviewStatus>('PENDING'),
    observations: this.fb.control<string | null>(null),
    recommendations: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.load();
    this.loadStatistics();
  }

  // Lista filtrada por año/mes/status
  filtered = computed(() => {
    const y = this.fYear();
    const m = this.fMonth();
    const s = this.fStatus();
    
    return this.items().filter(it => {
      const matchYear = y ? it.year === y : true;
      const matchMonth = m ? it.month === m : true;
      const matchStatus = s ? it.status === s : true;
      return matchYear && matchMonth && matchStatus;
    });
  });

  // UI Actions
  toggleNew(): void {
    const open = !this.isNewOpen();
    this.isNewOpen.set(open);
    if (!open) this.new();
  }

  new(): void {
    this.isEdit.set(false);
    this.form.reset({
      id: null,
      partnerDni: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      reviewDate: this.todayISO(),
      status: 'PENDING',
      observations: null,
      recommendations: null,
    });
  }

  edit(it: MonthlyReviewDTO): void {
    this.isEdit.set(true);
    
    // Convertir ISO datetime a date para el input
    const reviewDate = it.reviewDate ? it.reviewDate.substring(0, 10) : this.todayISO();
    
    this.form.patchValue({
      id: it.id,
      partnerDni: it.reviewedBy?.dni ?? '',
      year: it.year,
      month: it.month,
      reviewDate: reviewDate,
      status: it.status,
      observations: it.observations ?? null,
      recommendations: it.recommendations ?? null,
    });
    this.isNewOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      return; 
    }

    this.loading.set(true);
    this.error.set(null);

    const { id, ...rest } = this.form.getRawValue();

    if (!this.isEdit()) {
      // CREAR - convertir date a ISO datetime
      const payload: CreateMonthlyReviewDTO = {
        year: rest.year,
        month: rest.month,
        partnerDni: rest.partnerDni,
        reviewDate: rest.reviewDate ? this.toISODateTime(rest.reviewDate) : undefined,
        status: rest.status ?? undefined,
        observations: rest.observations ?? undefined,
        recommendations: rest.recommendations ?? undefined,
      };

      this.srv.create(payload).subscribe({
        next: () => {
          this.new();
          this.isNewOpen.set(false);
          this.load();
          this.loadStatistics();
        },
        error: (e) => {
          const errorMsg = (e?.error?.message ?? this.tr.instant('monthlyReview.errorCreate')) || 'Error al crear';
          this.error.set(errorMsg);
          this.loading.set(false);
        }
      });
    } else {
      // ACTUALIZAR
      const payload: PatchMonthlyReviewDTO = {
        reviewDate: rest.reviewDate ? this.toISODateTime(rest.reviewDate) : undefined,
        status: rest.status ?? undefined,
        observations: rest.observations ?? undefined,
        recommendations: rest.recommendations ?? undefined,
      };

      this.srv.update(id!, payload).subscribe({
        next: () => {
          this.new();
          this.isNewOpen.set(false);
          this.load();
          this.loadStatistics();
        },
        error: (e) => {
          const errorMsg = (e?.error?.message ?? this.tr.instant('monthlyReview.errorSave')) || 'Error al guardar';
          this.error.set(errorMsg);
          this.loading.set(false);
        }
      });
    }
  }

  delete(it: MonthlyReviewDTO): void {
    const msg = this.tr.instant('monthlyReview.confirmDelete') || '¿Eliminar revisión?';
    if (!confirm(msg)) return;

    this.loading.set(true);
    this.srv.delete(it.id).subscribe({
      next: () => { 
        this.load();
        this.loadStatistics();
      },
      error: (e) => {
        const errorMsg = (e?.error?.message ?? this.tr.instant('monthlyReview.errorDelete')) || 'No se pudo eliminar.';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  // Aplicar filtros y recargar estadísticas
  applyFilters(): void {
    this.loadStatistics();
  }

  trackById = (_: number, it: MonthlyReviewDTO) => it.id;

  // Carga de datos
  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    // Usar limit alto para traer todos los registros
    this.srv.list({ limit: 1000 }).subscribe({
      next: (res) => { 
        this.items.set(res.data ?? []); 
        this.loading.set(false); 
      },
      error: (e) => {
        const errorMsg = (e?.error?.message ?? this.tr.instant('monthlyReview.errorLoad')) || 'Error al cargar';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  private loadStatistics(): void {
    const year = this.fYear();
    const month = this.fMonth() ?? undefined;

    this.srv.statistics({ year, month, groupBy: 'product' }).subscribe({
      next: (res) => {
        this.statistics.set(res.data);
      },
      error: () => {
        this.statistics.set(null);
      }
    });
  }

  // Helpers
  private todayISO(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private toISODateTime(dateStr: string): string {
    if (dateStr.includes('T')) return dateStr;
    return `${dateStr}T10:00:00Z`;
  }

  // Para usar en el template
  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '$0.00';
    return `$${value.toFixed(2)}`;
  }
}