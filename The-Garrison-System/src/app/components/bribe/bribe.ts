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
import { GlassPanelComponent } from '../../shared/ui/glass-panel/glass-panel.component.js';

/**
 * BribeComponent
 *
 * Administra sobornos: listado con filtro, alta, edición parcial y marcado como pagado.
 * Usa signals para estado (lista/carga/error), formularios reactivos y i18n para mensajes.
 * Decisiones clave:
 * - En modo creación, authorityId/saleId/amount son obligatorios; en edición se relajan (solo se valida lo tocado).
 * - En edición, se genera un PATCH con los campos realmente modificados; si no hay cambios, se avisa.
 */

type BribeForm = {
  id: FormControl<number | null>;
  authorityId: FormControl<string | number | null>;
  saleId: FormControl<number | null>;
  amount: FormControl<number | null>;
  paid: FormControl<boolean>;
};

@Component({
  selector: 'app-bribe',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule, GlassPanelComponent],
  templateUrl: './bribe.html',
  styleUrls: ['./bribe.scss'],
})
export class BribeComponent implements OnInit {
  // --- Inyección ---
  private fb = inject(FormBuilder);
  private srv = inject(BribeService);
  private saleSrv = inject(SaleService);
  private authoritySrv = inject(AuthorityService);
  private t = inject(TranslateService);

  // --- Estado (signals) ---
  bribes = signal<BribeDTO[]>([]);
  sales = signal<SaleDTO[]>([]);
  authorities = signal<AuthorityDTO[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);
  filterText = '';

  // --- Form reactivo ---
  form: FormGroup<BribeForm> = this.fb.group<BribeForm>({
    id: this.fb.control<number | null>(null),
    authorityId: this.fb.control<string | number | null>(null, { validators: [Validators.required] }),
    saleId: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    paid: this.fb.nonNullable.control(false),
  });

  // Edición activa si hay id cargado
  get isEditing(): boolean { return !!this.form.controls.id.value; }

  // --- Ciclo de vida ---
  ngOnInit(): void {
    this.loadBribes();
    this.loadSales();
    this.loadAuthorities();
    this.setEditMode(false);
  }

  /**
   * Cambia validaciones según modo: en creación exigimos authorityId/saleId/amount;
   * en edición se permite enviar solo los campos modificados (patch) sin forzar el resto.
   */
  private setEditMode(isEdit: boolean) {
    const cfg = (ctrl: FormControl<any>, validators: any[]) => {
      ctrl.clearValidators();
      if (!isEdit) ctrl.setValidators(validators);
      ctrl.updateValueAndValidity({ emitEvent: false });
    };
    cfg(this.form.controls.authorityId, [Validators.required]);
    cfg(this.form.controls.saleId, [Validators.required, Validators.min(1)]);
    cfg(this.form.controls.amount, [Validators.required, Validators.min(0)]);
  }

  // --- Fetchers ---
  loadBribes() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.list().subscribe({
      next: (res: any) => {
        // Admite backends que respondan { bribes } o { data }
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
      next: (res: any) => { const list = (res?.sales ?? res?.data ?? []) as SaleDTO[]; this.sales.set(list); },
      error: () => {}
    });
  }

  loadAuthorities() {
    this.authoritySrv.getAllAuthorities().subscribe({
      next: (res: any) => { const list = (res?.authorities ?? res?.data ?? []) as AuthorityDTO[]; this.authorities.set(list); },
      error: () => {}
    });
  }

  // --- Filtrado reactivo por texto libre ---
  filtered = computed(() => {
    const q = (this.filterText || '').toLowerCase().trim();
    if (!q) return this.bribes();
    return this.bribes().filter(s =>
      String(s.id ?? '').includes(q) ||
      String((s.sale?.id ?? s.saleId) ?? '').includes(q) ||
      String(s.authority?.id ?? s.authorityId ?? '').includes(q)
    );
  });

  // --- Form helpers ---
  new() {
    // Estado limpio de creación
    this.form.reset({ id: null, authorityId: null, saleId: null, amount: null, paid: false });
    this.setEditMode(false);
    this.form.markAsPristine();
    this.error.set(null);
  }

  edit(s: BribeDTO) {
    // Precarga valores del DTO (acepta id en relación o llave suelta)
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

  // --- Guardado (create/patch) ---
  save() {
    const id = this.form.controls.id.value;

    // CREATE: requiere formulario válido completo
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

    // EDIT: construir PATCH solo con campos tocados
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

  // --- Acción rápida: marcar como pagado ---
  markAsPaid(s: BribeDTO) {
    if (!s.id) return; // seguridad
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
