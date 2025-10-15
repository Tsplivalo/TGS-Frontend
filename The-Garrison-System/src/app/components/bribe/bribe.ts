// src/app/components/bribe/bribe.component.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BribeService } from '../../services/bribe/bribe';
import { 
  ApiResponse, 
  BribeDTO, 
  CreateBribeDTO, 
  UpdateBribeDTO 
} from '../../models/bribe/bribe.model';
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
  private t = inject(TranslateService);

  // --- Estado ---
  loading = signal(false);
  error = signal<string | null>(null);
  bribes = signal<BribeDTO[]>([]);
  editId = signal<number | null>(null);
  isNewOpen = false;

  // --- Filtros ---
  fText = signal('');
  fPaid: 'all' | 'true' | 'false' = 'all';
  fDateType: 'all' | 'exact' | 'before' | 'after' | 'between' = 'all';
  fDate = '';
  fEndDate = '';

  // Filtrado reactivo
  filteredBribes = computed(() => {
    const txt = this.fText().toLowerCase().trim();
    const paidFilter = this.fPaid;

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
    authorityId: [null as number | null, [Validators.required]],
    saleId: [null as number | null, [Validators.required]],
  });

  // --- Ciclo de vida ---
  ngOnInit(): void {
    this.load();
  }

  // --- Data fetching ---
  load() {
    this.loading.set(true);
    this.error.set(null);

    // Si hay filtros activos, usar search
    if (this.fPaid !== 'all' || this.fDateType !== 'all') {
      this.search();
      return;
    }

    this.srv.getAllBribes().subscribe({
      next: (r: ApiResponse<BribeDTO[]>) => {
        this.bribes.set(r.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('bribes.errorLoad');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  // --- Búsqueda con filtros ---
  search() {
    this.loading.set(true);
    this.error.set(null);

    const paid = this.fPaid === 'all' ? undefined : this.fPaid;
    const date = this.fDateType !== 'all' && this.fDate ? this.fDate : undefined;
    const type = this.fDateType !== 'all' ? this.fDateType : undefined;
    const endDate = this.fDateType === 'between' && this.fEndDate ? this.fEndDate : undefined;

    this.srv.searchBribes(paid, date, type, endDate).subscribe({
      next: (r: ApiResponse<BribeDTO[]>) => {
        this.bribes.set(r.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('bribes.errorSearch');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
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
        this.load();
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
        this.load();
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
          this.load();
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
        authorityId: Number(value.authorityId!),
        saleId: Number(value.saleId!),
      };

      this.srv.createBribe(createData).subscribe({
        next: () => {
          this.resetForm();
          this.isNewOpen = false;
          this.load();
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
