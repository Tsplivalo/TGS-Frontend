import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { BribeService } from '../../services/bribe/bribe';
import { BribeDTO, CreateBribeDTO, UpdateBribeDTO } from '../../models/bribe/bribe.model';
import { SaleService } from '../../services/sale/sale';
import { AuthorityService } from '../../services/authority/authority';
import { SaleDTO } from '../../models/sale/sale.model';
import { AuthorityDTO } from '../../models/authority/authority.model';
import { GlassPanelComponent } from '../../shared/ui/glass-panel/glass-panel.component';

type BribeForm = {
  id: FormControl<number | null>;
  authorityId: FormControl<string | number | null>;
  saleId: FormControl<number | null>;
  amount: FormControl<number | null>;
  paid: FormControl<boolean>;
};

/**
 * BribeComponent
 *
 * Administra sobornos: listado con filtro, alta, edición parcial y marcado como pagado.
 * - Estado con Signals (lista/carga/error, filtros).
 * - Formularios reactivos.
 * - i18n con ngx-translate.
 * - Create requiere authorityId/saleId/amount; Edit permite PATCH solo de campos tocados.
 */
@Component({
  selector: 'app-bribe',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, GlassPanelComponent],
  templateUrl: './bribe.html',
  styleUrls: ['./bribe.scss'],
})
export class BribeComponent implements OnInit {
  // ─────────────────────────────────────────────
  // Inyección de dependencias
  // ─────────────────────────────────────────────
  private fb         = inject(FormBuilder);
  private srv        = inject(BribeService);
  private saleSrv    = inject(SaleService);
  private authoritySrv = inject(AuthorityService);
  private t          = inject(TranslateService);

  // ─────────────────────────────────────────────
  // Estado base (Signals)
  // ─────────────────────────────────────────────
  /** Listado principal. */
  bribes = signal<BribeDTO[]>([]);
  /** Catálogos auxiliares (si los mostrás en selects). */
  sales = signal<SaleDTO[]>([]);
  authorities = signal<AuthorityDTO[]>([]);

  /** Carga global y último error. */
  loading = signal(false);
  error   = signal<string | null>(null);

  /** Texto libre para filtrar (usado por el HTML con fText() / fText.set()). */
  fText   = signal<string>('');

  // ─────────────────────────────────────────────
  // Formulario reactivo
  // ─────────────────────────────────────────────
  form: FormGroup<BribeForm> = this.fb.group<BribeForm>({
    id:          this.fb.control<number | null>(null),
    authorityId: this.fb.control<string | number | null>(null, { validators: [Validators.required] }),
    saleId:      this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    amount:      this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    paid:        this.fb.nonNullable.control(false),
  });

  /** Edición activa si hay id cargado. */
  get isEditing(): boolean { return !!this.form.controls.id.value; }

  // ─────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────
  ngOnInit(): void {
    this.loadBribes();
    this.loadSales();
    this.loadAuthorities();
    this.setEditMode(false);
  }

  /**
   * Cambia validaciones según modo:
   * - CREATE: authorityId/saleId/amount obligatorios.
   * - EDIT: se relajan para permitir PATCH parcial (solo campos tocados).
   */
  private setEditMode(isEdit: boolean) {
    const set = (ctrl: FormControl<any>, validators: any[]) => {
      ctrl.clearValidators();
      if (!isEdit) ctrl.setValidators(validators);
      ctrl.updateValueAndValidity({ emitEvent: false });
    };
    set(this.form.controls.authorityId, [Validators.required]);
    set(this.form.controls.saleId, [Validators.required, Validators.min(1)]);
    set(this.form.controls.amount, [Validators.required, Validators.min(0)]);
  }

  // ─────────────────────────────────────────────
  // Fetchers
  // ─────────────────────────────────────────────
  loadBribes() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.list().subscribe({
      next: (res: any) => {
        const list = (res?.bribes ?? res?.data ?? []) as BribeDTO[];
        this.bribes.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.t.instant('bribes.errorLoad'));
        this.loading.set(false);
      }
    });
  }

  loadSales() {
    this.saleSrv.getAllSales().subscribe({
      next: (res: any) => { this.sales.set((res?.sales ?? res?.data ?? []) as SaleDTO[]); },
      error: () => {}
    });
  }

  loadAuthorities() {
    this.authoritySrv.getAllAuthorities().subscribe({
      next: (res: any) => { this.authorities.set((res?.authorities ?? res?.data ?? []) as AuthorityDTO[]); },
      error: () => {}
    });
  }

  // ─────────────────────────────────────────────
  // Filtrado
  // ─────────────────────────────────────────────
  filtered = computed(() => {
    const q = this.fText().toLowerCase().trim();
    if (!q) return this.bribes();
    return this.bribes().filter(s =>
      String(s.id ?? '').includes(q) ||
      String((s.sale?.id ?? s.saleId) ?? '').includes(q) ||
      String(s.authority?.id ?? s.authorityId ?? '').includes(q) ||
      String(s.amount ?? '').toLowerCase().includes(q) ||
      (s.creationDate ? new Date(s.creationDate).toISOString().toLowerCase().includes(q) : false)
    );
  });

  // trackBy para *ngFor si no usás @for
  trackById = (_: number, s: BribeDTO) => s.id;

  // ─────────────────────────────────────────────
  // Helpers de formulario
  // ─────────────────────────────────────────────
  /** Estado limpio de creación. */
  new() {
    this.form.reset({ id: null, authorityId: null, saleId: null, amount: null, paid: false });
    this.setEditMode(false);
    this.form.markAsPristine();
    this.error.set(null);
  }

  /** Precarga DTO para edición. */
  edit(s: BribeDTO) {
    this.form.reset();
    this.form.patchValue({
      id: s.id ?? null,
      authorityId: (s.authority?.id ?? s.authorityId ?? null) as any,
      saleId: (s.sale?.id ?? s.saleId ?? null) as number | null,
      amount: (s.amount ?? null) as number | null,
      paid: !!s.paid,
    });
    this.setEditMode(true);
    this.form.markAsPristine();
    this.error.set(null);
  }

  // ─────────────────────────────────────────────
  // Guardado (create / patch)
  // ─────────────────────────────────────────────
  save() {
    const id = this.form.controls.id.value;

    // CREATE
    if (!id) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.error.set(this.t.instant('bribes.err.completeAll'));
        return;
      }
      const body: CreateBribeDTO = {
        amount: Number(this.form.controls.amount.value),
        authorityId: String(this.form.controls.authorityId.value!),
        saleId: Number(this.form.controls.saleId.value!),
        paid: !!this.form.controls.paid.value,
      };
      this.loading.set(true);
      this.error.set(null);
      this.srv.create(body).subscribe({
        next: () => { this.new(); this.loadBribes(); },
        error: (err) => { this.error.set(err?.error?.message || this.t.instant('bribes.errorCreate')); this.loading.set(false); }
      });
      return;
    }

    // EDIT (PATCH parcial de campos tocados)
    const c = this.form.controls;
    const patch: UpdateBribeDTO = {};
    if (c.amount.dirty)      patch.amount = Number(c.amount.value);
    if (c.authorityId.dirty) patch.authorityId = String(c.authorityId.value!);
    if (c.saleId.dirty)      patch.saleId = Number(c.saleId.value!);

    if (Object.keys(patch).length === 0) {
      this.error.set(this.t.instant('bribes.err.noChanges'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.srv.update(id, patch).subscribe({
      next: () => { this.new(); this.loadBribes(); },
      error: (err) => { this.error.set(err?.error?.message || this.t.instant('bribes.errorUpdate')); this.loading.set(false); }
    });
  }

  // ─────────────────────────────────────────────
  // Acción rápida
  // ─────────────────────────────────────────────
  /** Marca un soborno como pagado (idempotente en backend). */
  markAsPaid(s: BribeDTO) {
    if (!s.id) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.payOne(s.id).subscribe({
      next: () => this.loadBribes(),
      error: (err) => {
        this.error.set(err?.error?.message || this.t.instant('bribes.errorMarkPaid'));
        this.loading.set(false);
      }
    });
  }
}
