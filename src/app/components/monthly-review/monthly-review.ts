import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { ChartConfiguration } from 'chart.js';

// Services
import { MonthlyReviewService } from '../../services/monthly-review/monthly-review';
import { PartnerService } from '../../services/partner/partner';

// Models
import {
  MonthlyReviewDTO,
  CreateMonthlyReviewDTO,
  PatchMonthlyReviewDTO,
  ReviewStatus
} from '../../models/monthly-review/monthly-review.model';
import { PartnerDTO } from '../../models/partner/partner.model';

// ✅ IMPORTAR COMPONENTE DE CHART
import { ChartComponent } from '../chart/chart';

@Component({
  selector: 'app-monthly-review',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    TranslateModule,
    ChartComponent
  ],
  templateUrl: './monthly-review.html',
  styleUrls: ['./monthly-review.scss'],
})
export class MonthlyReviewComponent implements OnInit {
  private fb  = inject(FormBuilder);
  private srv = inject(MonthlyReviewService);
  private partnerSrv = inject(PartnerService);
  private tr  = inject(TranslateService);

  // ✅ FLAG PARA TESTING - Cambia a false cuando tengas datos reales
  private readonly USE_MOCK_CHARTS = false; // Cambiado a false para usar datos reales

  // Estado
  items   = signal<MonthlyReviewDTO[]>([]);
  statistics = signal<any>(null);
  loading = signal(false);
  error   = signal<string | null>(null);
  isNewOpen = signal(false);
  isEdit    = signal(false);

  partners = signal<PartnerDTO[]>([]);

  // Filtros
  fYearInput = signal<number>(new Date().getFullYear());
  fYearApplied = signal<number>(new Date().getFullYear());
  fMonthInput = signal<number | null>(null);
  fMonthApplied = signal<number | null>(null);
  fStatusInput = signal<ReviewStatus | null>(null);
  fStatusApplied = signal<ReviewStatus | null>(null);

  // ✅ DATOS PARA GRÁFICOS
  statusChartData = signal<ChartConfiguration['data'] | null>(null);
  reviewsTrendChartData = signal<ChartConfiguration['data'] | null>(null);
  productSalesChartData = signal<ChartConfiguration['data'] | null>(null);

  // Para mostrar gráficos incluso sin datos
  showCharts = computed(() => {
    return this.USE_MOCK_CHARTS || (!this.loading() && this.items().length > 0);
  });

  // Formulario
  form = this.fb.group({
    id: this.fb.control<number | null>(null),
    partnerDni: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
    year:  this.fb.control<number>(new Date().getFullYear(), [Validators.required, Validators.min(2000)]),
    month: this.fb.control<number>(new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]),
    reviewDate: this.fb.control<string | null>(this.todayISO()),
    status: this.fb.control<ReviewStatus>('PENDING'),
    observations: this.fb.control<string | null>(null),
    recommendations: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.loadAll();
    
    // ✅ Si usamos mock, generar gráficos inmediatamente
    if (this.USE_MOCK_CHARTS) {
      this.generateMockCharts();
    }
  }

  filtered = computed(() => {
    const y = this.fYearApplied();
    const m = this.fMonthApplied();
    const s = this.fStatusApplied();
    
    return this.items().filter(it => {
      const matchYear = y ? it.year === y : true;
      const matchMonth = m ? it.month === m : true;
      const matchStatus = s ? it.status === s : true;
      return matchYear && matchMonth && matchStatus;
    });
  });

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
      const payload: CreateMonthlyReviewDTO = {
        year: rest.year!,
        month: rest.month!,
        partnerDni: rest.partnerDni!,
        ...(rest.reviewDate && rest.reviewDate.trim() !== '' && {
          reviewDate: this.toISODateTime(rest.reviewDate)
        }),
        ...(rest.status && { status: rest.status }),
        ...(rest.observations && rest.observations.trim() !== '' && {
          observations: rest.observations
        }),
        ...(rest.recommendations && rest.recommendations.trim() !== '' && {
          recommendations: rest.recommendations
        }),
      };

      this.srv.create(payload).subscribe({
        next: () => {
          this.new();
          this.isNewOpen.set(false);
          this.loadAll();
        },
        error: (e) => {
          const errorMsg = (e?.error?.message ?? this.tr.instant('monthlyReview.errorCreate')) || 'Error al crear';
          this.error.set(errorMsg);
          this.loading.set(false);
        }
      });
    } else {
      const payload: PatchMonthlyReviewDTO = {
        ...(rest.reviewDate && rest.reviewDate.trim() !== '' && {
          reviewDate: this.toISODateTime(rest.reviewDate)
        }),
        ...(rest.status && { status: rest.status }),
        ...(rest.observations !== null && rest.observations !== undefined && {
          observations: rest.observations
        }),
        ...(rest.recommendations !== null && rest.recommendations !== undefined && {
          recommendations: rest.recommendations
        }),
      };

      this.srv.update(id!, payload).subscribe({
        next: () => {
          this.new();
          this.isNewOpen.set(false);
          this.loadAll();
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
        this.loadAll();
      },
      error: (e) => {
        const errorMsg = (e?.error?.message ?? this.tr.instant('monthlyReview.errorDelete')) || 'No se pudo eliminar.';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.fYearApplied.set(this.fYearInput());
    this.fMonthApplied.set(this.fMonthInput());
    this.fStatusApplied.set(this.fStatusInput());
    this.loadStatistics();
    
    if (!this.USE_MOCK_CHARTS) {
      this.updateCharts();
    }
  }

  clearFilters(): void {
    const currentYear = new Date().getFullYear();
    this.fYearInput.set(currentYear);
    this.fMonthInput.set(null);
    this.fStatusInput.set(null);
    this.fYearApplied.set(currentYear);
    this.fMonthApplied.set(null);
    this.fStatusApplied.set(null);
    this.loadStatistics();
    
    if (!this.USE_MOCK_CHARTS) {
      this.updateCharts();
    }
  }

  trackById = (_: number, it: MonthlyReviewDTO) => it.id;

  private loadAll(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      reviews: this.srv.search(), // Retorna PaginatedResponse<MonthlyReviewDTO>
      partners: this.partnerSrv.list() // Asume que retorna similar estructura
    }).subscribe({
      next: (res) => {
        // ✅ Usar res.reviews.data directamente (ya es array, no tiene .data dentro)
        this.items.set(res.reviews.data ?? []);
        this.partners.set(res.partners.data ?? []);
        this.loading.set(false);
        
        this.loadStatistics();
        
        if (!this.USE_MOCK_CHARTS) {
          this.updateCharts();
        }
      },
      error: (e) => {
        const errorMsg = e?.error?.message || 'Error al cargar datos';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  totalReviews = computed(() => this.items().length);
  
  reviewsByStatus = computed(() => {
    const byStatus: Record<ReviewStatus, number> = {
      PENDING: 0,
      IN_REVIEW: 0,
      COMPLETED: 0,
      APPROVED: 0,
      REJECTED: 0
    };
    this.items().forEach(r => {
      if (r.status && byStatus.hasOwnProperty(r.status)) {
        byStatus[r.status]++;
      }
    });
    return byStatus;
  });

  private loadStatistics(): void {
    const year = this.fYearApplied();
    const month = this.fMonthApplied() ?? undefined;

    if (!year || isNaN(year) || year < 2000) {
      this.statistics.set(null);
      return;
    }

    this.srv.statistics({ year, month, groupBy: 'product' }).subscribe({
      next: (res) => {
        this.statistics.set(res.data);
      },
      error: (e) => {
        console.error('Error loading statistics:', e);
        this.statistics.set(null);
      }
    });
  }

  // ✅ GENERAR GRÁFICOS CON DATOS MOCK
  private generateMockCharts(): void {
    console.log('📊 Generando gráficos MOCK para demostración');
    
    // Mock: Distribución por estado
    this.statusChartData.set({
      labels: ['Pendiente', 'En Revisión', 'Completado', 'Aprobado', 'Rechazado'],
      datasets: [{
        label: 'Revisiones',
        data: [12, 8, 15, 22, 5],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)',
          'rgba(74, 141, 114, 0.8)',
          'rgba(169, 69, 69, 0.8)'
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(107, 114, 128, 1)',
          'rgba(74, 141, 114, 1)',
          'rgba(169, 69, 69, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }]
    });

    // Mock: Tendencia por mes
    this.reviewsTrendChartData.set({
      labels: ['Enero 2025', 'Febrero 2025', 'Marzo 2025', 'Abril 2025', 'Mayo 2025', 'Junio 2025'],
      datasets: [{
        label: 'Revisiones por Mes',
        data: [8, 12, 10, 15, 14, 18],
        backgroundColor: 'rgba(195, 164, 98, 0.2)',
        borderColor: 'rgba(195, 164, 98, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(195, 164, 98, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    });

    // Mock: Productos top
    this.productSalesChartData.set({
      labels: ['Antiparras', 'Botella', 'Vaso', 'Papel', 'Teclado', 'Mouse', 'Monitor', 'Teclado RGB'],
      datasets: [{
        label: 'Monto de Ventas ($)',
        data: [160000, 60000, 40000, 5000, 3000, 25000, 85000, 42000],
        backgroundColor: 'rgba(195, 164, 98, 0.8)',
        borderColor: 'rgba(195, 164, 98, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    });
  }

  // ✅ GENERAR DATOS REALES PARA GRÁFICOS
  private updateCharts(): void {
    this.updateStatusChart();
    this.updateReviewsTrendChart();
    this.updateProductSalesChart();
  }

  private updateStatusChart(): void {
    const statusData = this.reviewsByStatus();
    
    this.statusChartData.set({
      labels: ['Pendiente', 'En Revisión', 'Completado', 'Aprobado', 'Rechazado'],
      datasets: [{
        label: 'Revisiones',
        data: [
          statusData.PENDING,
          statusData.IN_REVIEW,
          statusData.COMPLETED,
          statusData.APPROVED,
          statusData.REJECTED
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(107, 114, 128, 0.8)',
          'rgba(74, 141, 114, 0.8)',
          'rgba(169, 69, 69, 0.8)'
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(107, 114, 128, 1)',
          'rgba(74, 141, 114, 1)',
          'rgba(169, 69, 69, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }]
    });
  }

  private updateReviewsTrendChart(): void {
    const filtered = this.filtered();
    
    const byMonth = new Map<string, number>();
    filtered.forEach(review => {
      const key = `${review.year}-${String(review.month).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    });

    const sorted = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    this.reviewsTrendChartData.set({
      labels: sorted.map(([key]) => {
        const [year, month] = key.split('-');
        return `${this.getMonthName(parseInt(month))} ${year}`;
      }),
      datasets: [{
        label: 'Revisiones por Mes',
        data: sorted.map(([, count]) => count),
        backgroundColor: 'rgba(195, 164, 98, 0.2)',
        borderColor: 'rgba(195, 164, 98, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(195, 164, 98, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    });
  }

  private updateProductSalesChart(): void {
    const stats = this.statistics();
    
    // ✅ Verificar si hay groupedData y si tiene elementos
    if (!stats || !stats.groupedData || stats.groupedData.length === 0) {
      this.productSalesChartData.set(null);
      return;
    }

    // Tomar top 10 productos y ordenar por totalAmount
    const topProducts = [...stats.groupedData]
      .sort((a: any, b: any) => (b.totalAmount || 0) - (a.totalAmount || 0))
      .slice(0, 10);

    this.productSalesChartData.set({
      labels: topProducts.map((p: any) => {
        // Prioridad: productName > nombre del producto > ID
        return p.productName || p.name || `Producto ${p.productId || p.id}`;
      }),
      datasets: [{
        label: 'Monto de Ventas ($)',
        data: topProducts.map((p: any) => p.totalAmount || 0),
        backgroundColor: 'rgba(195, 164, 98, 0.8)',
        borderColor: 'rgba(195, 164, 98, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    });
  }

  private todayISO(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private toISODateTime(dateStr: string): string {
    if (dateStr.includes('T')) return dateStr;
    
    const date = new Date(dateStr + 'T12:00:00.000Z');
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    
    return dateStr + 'T12:00:00.000Z';
  }

  private getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || '';
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '$0.00';
    return `$${value.toFixed(2)}`;
  }
}