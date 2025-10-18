// src/app/components/bribe/bribe.component.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

// Services
import { BribeService } from '../../services/bribe/bribe';
import { AuthorityService } from '../../services/authority/authority';
import { SaleService } from '../../services/sale/sale';

// Models
import { 
  ApiResponse, 
  BribeDTO, 
  CreateBribeDTO, 
  UpdateBribeDTO 
} from '../../models/bribe/bribe.model';
import { AuthorityDTO } from '../../models/authority/authority.model';
import { SaleDTO } from '../../models/sale/sale.model';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * BribeComponent
 *
 * Gestión de sobornos: listado con filtros, alta, edición y pago.
 * Usa signals para loading/error/lista, form reactivo para validación y i18n para mensajes.
 */

@Component({
  selector: 'app-bribe',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './bribe.html',
  styleUrls: ['./bribe.scss']
})
export class BribeComponent implements OnInit {
  // --- Inyección ---
  private fb = inject(FormBuilder);
  private srv = inject(BribeService);
  private authSrv = inject(AuthorityService);
  private saleSrv = inject(SaleService);
  private t = inject(TranslateService);

  // --- Estado ---
  loading = signal(false);
  error = signal<string | null>(null);
  bribes = signal<BribeDTO[]>([]);
  editId = signal<number | null>(null);
  isNewOpen = false;

  // ✅ Datos para selects
  authorities = signal<AuthorityDTO[]>([]);
  sales = signal<SaleDTO[]>([]);

  // --- Filtros ---
  fTextInput = signal('');
  fTextApplied = signal('');
  fPaidInput = signal<'all' | 'true' | 'false'>('all');
  fPaidApplied = signal<'all' | 'true' | 'false'>('all');
  fDateTypeInput = signal<'all' | 'exact' | 'before' | 'after' | 'between'>('all');
  fDateTypeApplied = signal<'all' | 'exact' | 'before' | 'after' | 'between'>('all');
  fDateInput = signal('');
  fDateApplied = signal('');
  fEndDateInput = signal('');
  fEndDateApplied = signal('');

  // Filtrado reactivo
  filteredBribes = computed(() => {
  const txt = this.fTextApplied().toLowerCase().trim();
  const paidFilter = this.fPaidApplied();

  return this.bribes().filter(b => {
    // Filtro por texto
    const matchText = !txt
      || String(b.id).includes(txt)
      || String(b.amount).includes(txt)
      || b.authority?.name.toLowerCase().includes(txt)
      || b.authority?.dni.includes(txt)
      || String(b.sale?.id).includes(txt);

    // Filtro por estado de pago
    const matchPaid = paidFilter === 'all'
      || (paidFilter === 'true' && b.paid)
      || (paidFilter === 'false' && !b.paid);

    return matchText && matchPaid;
  });
});

  // --- Form reactivo ---
  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0)]],
    authorityId: [null as string | null, [Validators.required]], // ✅ String (DNI)
    saleId: [null as number | null, [Validators.required]],
  });

  // --- Ciclo de vida ---
  ngOnInit(): void {
    this.loadAll();
  }

  // --- Data fetching ---
  /**
   * ✅ Carga paralela de TODOS los datos necesarios
   * - Sobornos
   * - Autoridades
   * - Ventas
   */
  loadAll() {
    this.loading.set(true);
    this.error.set(null);

    // Si hay filtros activos en sobornos, usar search
const bribesRequest = (this.fPaidApplied() !== 'all' || this.fDateTypeApplied() !== 'all')      ? this.getBribesFiltered()
      : this.srv.getAllBribes();

    forkJoin({
      bribes: bribesRequest,
      authorities: this.authSrv.getAllAuthorities(),
      sales: this.saleSrv.getAllSales()
    }).subscribe({
      next: (res) => {
        // Sobornos
        this.bribes.set(Array.isArray(res.bribes) ? res.bribes : res.bribes.data ?? []);
        
        // Autoridades
        this.authorities.set(res.authorities.data ?? []);
        
        // Ventas
        this.sales.set(res.sales ?? []);
        
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('bribes.errorLoad');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
  this.fTextApplied.set(this.fTextInput());
  this.fPaidApplied.set(this.fPaidInput());
  this.fDateTypeApplied.set(this.fDateTypeInput());
  this.fDateApplied.set(this.fDateInput());
  this.fEndDateApplied.set(this.fEndDateInput());
  this.loadAll(); // Recarga datos si hay filtros de fecha
}

clearFilters() {
  this.fTextInput.set('');
  this.fPaidInput.set('all');
  this.fDateTypeInput.set('all');
  this.fDateInput.set('');
  this.fEndDateInput.set('');
  this.fTextApplied.set('');
  this.fPaidApplied.set('all');
  this.fDateTypeApplied.set('all');
  this.fDateApplied.set('');
  this.fEndDateApplied.set('');
  this.loadAll();
}

  /**
   * Helper para obtener sobornos filtrados
   */
  private getBribesFiltered() {
    const paidValue = this.fPaidApplied();
    const paid = paidValue === 'all' ? undefined : paidValue as 'true' | 'false';
    const dateType = this.fDateTypeApplied();
    const date = dateType !== 'all' && this.fDateApplied() ? this.fDateApplied() : undefined;
    const type = dateType !== 'all' ? dateType : undefined;
    const endDate = dateType === 'between' && this.fEndDateApplied() ? this.fEndDateApplied() : undefined;

    return this.srv.searchBribes(paid, date, type, endDate);
  }

  totalBribes = computed(() => this.bribes().length);
  totalAmount = computed(() => 
    this.bribes().reduce((sum, b) => sum + (b.amount || 0), 0)
  );
  paidBribes = computed(() => 
    this.bribes().filter(b => b.paid).length
  );
  pendingBribes = computed(() => 
    this.bribes().filter(b => !b.paid).length
  );
  pendingAmount = computed(() =>
    this.bribes().filter(b => !b.paid).reduce((sum, b) => sum + (b.amount || 0), 0)
  );

  /**
   * Wrapper para recargar cuando cambian filtros
   */
  load() {
    this.loadAll();
  }

  // --- UI helpers ---
  toggleNew() {
    this.isNewOpen = !this.isNewOpen;
    if (this.isNewOpen) {
      this.resetForm();
    }
  }

  resetForm() {
    this.editId.set(null);
    this.form.reset({
      amount: null,
      authorityId: null,
      saleId: null,
    });
    // Re-habilitar campos
    this.form.get('authorityId')?.enable();
    this.form.get('saleId')?.enable();
    this.error.set(null);
  }

  edit(b: BribeDTO) {
    this.editId.set(b.id);
    this.form.patchValue({
      amount: b.amount,
      authorityId: null, // No se puede editar
      saleId: null, // No se puede editar
    });

    // Deshabilitar campos que no se pueden editar
    this.form.get('authorityId')?.disable();
    this.form.get('saleId')?.disable();

    this.isNewOpen = true;
    this.error.set(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Pago ---
  markAsPaid(bribe: BribeDTO) {
    if (!bribe.id || bribe.paid) return;

    if (!confirm(this.t.instant('bribes.confirmPay'))) return;

    this.loading.set(true);
    this.error.set(null);

    this.srv.payBribes([bribe.id]).subscribe({
      next: () => {
        this.loadAll();
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('bribes.errorPay');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  // --- Borrado ---
  delete(id: number) {
    if (!confirm(this.t.instant('bribes.confirmDelete'))) return;

    this.loading.set(true);
    this.error.set(null);

    this.srv.deleteBribe(id).subscribe({
      next: () => {
        this.loadAll();
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('bribes.errorDelete');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  // --- Guardado (create/update) ---
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const isEdit = this.editId() !== null;

    this.loading.set(true);
    this.error.set(null);

    if (isEdit) {
      // Actualizar soborno existente (solo amount)
      const updateData: UpdateBribeDTO = {
        amount: Number(value.amount!),
      };

      this.srv.updateBribe(this.editId()!, updateData).subscribe({
        next: () => {
          this.resetForm();
          this.isNewOpen = false;
          this.loadAll();
        },
        error: (err) => {
          const msg = err?.error?.message || this.t.instant('bribes.errorSave');
          this.error.set(msg);
          this.loading.set(false);
        }
      });
    } else {
      // Crear nuevo soborno
      const createData: CreateBribeDTO = {
        amount: Number(value.amount!),
        authorityId: String(value.authorityId!), // ✅ Enviar como string (DNI)
        saleId: Number(value.saleId!),
      };

      this.srv.createBribe(createData).subscribe({
        next: () => {
          this.resetForm();
          this.isNewOpen = false;
          this.loadAll();
        },
        error: (err) => {
          const msg = err?.error?.message || this.t.instant('bribes.errorCreate');
          this.error.set(msg);
          this.loading.set(false);
        }
      });
    }
  }

  // --- Validación helpers ---
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return this.t.instant(`bribes.errors.${field}Required`);
    }
    if (control.errors['min']) {
      return this.t.instant('bribes.errors.minValue', { min: control.errors['min'].min });
    }

    return this.t.instant('bribes.errors.invalid');
  }

  // --- Helpers para template ---
  trackById = (_: number, item: BribeDTO) => item.id;
}