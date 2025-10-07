import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { BribeService } from '../../services/bribe/bribe';
import { BribeDTO, CreateBribeDTO, UpdateBribeDTO } from '../../models/bribe/bribe.model';
import { SaleService } from '../../services/sale/sale';
import { AuthorityService } from '../../services/authority/authority';
import { SaleDTO } from '../../models/sale/sale.model';
import { AuthorityDTO } from '../../models/authority/authority.model';
import { GlassPanelComponent } from '../../shared/ui/glass-panel/glass-panel.component.js';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, GlassPanelComponent],
  templateUrl: './bribe.html',
  styleUrls: ['./bribe.scss'],
})
export class BribeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(BribeService);
  private saleSrv = inject(SaleService);
  private authoritySrv = inject(AuthorityService);

  bribes = signal<BribeDTO[]>([]);
  sales = signal<SaleDTO[]>([]);
  authorities = signal<AuthorityDTO[]>([]);

  loading = signal(false);
  error = signal<string | null>(null);
  filterText = '';

  form: FormGroup<BribeForm> = this.fb.group<BribeForm>({
    id: this.fb.control<number | null>(null),
    authorityId: this.fb.control<string | number | null>(null, { validators: [Validators.required] }),
    saleId: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    amount: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    paid: this.fb.nonNullable.control(false),
  });

  get isEditing(): boolean { return !!this.form.controls.id.value; }

  ngOnInit(): void {
    this.loadBribes();
    this.loadSales();
    this.loadAuthorities();
    this.setEditMode(false);
  }

  private setEditMode(isEdit: boolean) {
    const cfg = (ctrl: FormControl<any>, validators: any[]) => {
      ctrl.clearValidators();
      if (!isEdit) ctrl.setValidators(validators); // required only when creating
      ctrl.updateValueAndValidity({ emitEvent: false });
    };
    cfg(this.form.controls.authorityId, [Validators.required]);
    cfg(this.form.controls.saleId, [Validators.required, Validators.min(1)]);
    cfg(this.form.controls.amount, [Validators.required, Validators.min(0)]);
  }

  loadBribes() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (res: any) => {
        const list = (res?.bribes ?? res?.data ?? []) as BribeDTO[];
        this.bribes.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not load bribes.');
        this.loading.set(false);
      }
    });
  }

  loadSales() {
    this.saleSrv.getAllSales().subscribe({
      next: (res: any) => {
        const list = (res?.sales ?? res?.data ?? []) as SaleDTO[];
        this.sales.set(list);
      },
      error: (err) => console.warn('[BRIBE] Could not load sales:', err)
    });
  }

  loadAuthorities() {
    this.authoritySrv.getAllAuthorities().subscribe({
      next: (res: any) => {
        const list = (res?.authorities ?? res?.data ?? []) as AuthorityDTO[];
        this.authorities.set(list);
      },
      error: (err) => console.warn('[BRIBE] Could not load authorities:', err)
    });
  }

  filtered = computed(() => {
    const q = (this.filterText || '').toLowerCase().trim();
    if (!q) return this.bribes();
    return this.bribes().filter(s =>
      String(s.id ?? '').includes(q) ||
      String((s.sale?.id ?? s.saleId) ?? '').includes(q) ||
      String(s.authority?.id ?? s.authorityId ?? '').includes(q)
    );
  });

  new() {
    this.form.reset({ id: null, authorityId: null, saleId: null, amount: null, paid: false });
    this.setEditMode(false);
    this.form.markAsPristine();
    this.error.set(null);
  }

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

  save() {
    const id = this.form.controls.id.value;

    if (!id) {
      // === CREATE ===
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.error.set('Complete all fields.');
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
        error: (err) => {
          this.error.set(err?.error?.message || 'Could not create.');
          this.loading.set(false);
        }
      });
      return;
    }

    // === EDIT (partial PATCH) ===
    const c = this.form.controls;
    const patch: UpdateBribeDTO = {};
    if (c.amount.dirty)      patch.amount = Number(c.amount.value);
    if (c.authorityId.dirty) patch.authorityId = String(c.authorityId.value!);
    if (c.saleId.dirty)    patch.saleId = Number(c.saleId.value!);
    if (c.paid.dirty)     patch.paid = !!c.paid.value;

    if (Object.keys(patch).length === 0) {
      this.error.set('There are no changes to save.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.srv.update(id, patch).subscribe({
      next: () => { this.new(); this.loadBribes(); },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not update.');
        this.loading.set(false);
      }
    });
  }

  markAsPaid(s: BribeDTO) {
    if (!s.id) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.update(s.id, { paid: true }).subscribe({
      next: () => this.loadBribes(),
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not mark as paid.');
        this.loading.set(false);
      }
    });
  }
}