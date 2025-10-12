import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DistributorService } from '../../services/distributor/distributor';
import { ZoneService } from '../../services/zone/zone';
import { ProductService } from '../../services/product/product';

import { ZoneDTO } from '../../models/zone/zona.model';
import { ProductDTO } from '../../models/product/product.model';
import { DistributorDTO, CreateDistributorDTO, PatchDistributorDTO } from '../../models/distributor/distributor.model';

/**
 * DistributorComponent
 *
 * CRUD de distribuidores con:
 * - Listado + filtro por texto (dni/nombre/email/zona)
 * - Form reactivo con validación y normalización de tipos (zoneId string→number)
 * - Estrategia de guardado: POST para crear y PATCH con campos dirty para editar
 * - Mensajes listos para i18n y manejo de carga/errores con signals
 */

type DistForm = {
  dni: FormControl<string>;
  name: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
  address: FormControl<string>;
  zoneId: FormControl<number | null>;
  productsIds: FormControl<number[]>;
};

@Component({
  selector: 'app-distributor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './distributor.html',
  styleUrls: ['./distributor.scss'],
})
export class DistributorComponent implements OnInit {
  // --- Inyección ---
  private fb = inject(FormBuilder);
  private srv = inject(DistributorService);
  private zoneSrv = inject(ZoneService);
  private prodSrv = inject(ProductService);
  private t = inject(TranslateService);

  // --- Estado base ---
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  list = signal<DistributorDTO[]>([]);
  zones = signal<ZoneDTO[]>([]);
  products = signal<ProductDTO[]>([]);
  fText = '';

  // --- UI ---
  isFormOpen = false;
  isEdit = signal(false); // true si estamos editando

  // --- Form reactivo ---
  form: FormGroup<DistForm> = this.fb.group<DistForm>({
    dni: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    phone: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    address: this.fb.nonNullable.control(''),
    zoneId: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    productsIds: this.fb.nonNullable.control<number[]>([]),
  });

  // --- Ciclo de vida ---
  ngOnInit(): void {
    this.load();
    this.loadZones();
    this.loadProducts();

    // Normaliza zoneId si viene como string desde el <select>
    this.form.controls.zoneId.valueChanges.subscribe(v => {
      if (typeof v === 'string' && v !== '') {
        const n = Number(v);
        if (!Number.isNaN(n)) this.form.controls.zoneId.setValue(n, { emitEvent: false });
      }
    });
  }

  // --- Data ---
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (res) => { this.list.set(res); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message || this.t.instant('distributors.errorLoad')); this.loading.set(false); }
    });
  }

  loadZones() {
    this.zoneSrv.getAllZones().subscribe({
      next: (res: any) => this.zones.set(res?.data ?? res ?? []),
      error: () => {}
    });
  }

  loadProducts() {
    this.prodSrv.getAllProducts().subscribe({
      next: (res: any) => this.products.set(res?.data ?? res ?? []),
      error: () => {}
    });
  }

  // --- Listado filtrado ---
  filtered = computed(() => {
    const q = (this.fText || '').toLowerCase().trim();
    if (!q) return this.list();
    return this.list().filter(d =>
      String(d.dni).includes(q) ||
      (d.name || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.zone?.name || '').toLowerCase().includes(q)
    );
  });

  // --- UI helpers ---
  new() {
    this.isEdit.set(false);
    this.submitted.set(false);
    this.error.set(null);
    this.form.reset({ dni: '', name: '', phone: '', email: '', address: '', zoneId: null, productsIds: [] });
    this.isFormOpen = true;
  }

  edit(d: DistributorDTO) {
    this.isEdit.set(true);
    this.submitted.set(false);
    this.error.set(null);
    this.form.reset({
      dni: String(d.dni ?? ''),
      name: d.name ?? '',
      phone: d.phone ?? '',
      email: d.email ?? '',
      address: d.address ?? '',
      zoneId: (d.zone?.id ?? d.zoneId ?? null) as number | null,
      productsIds: (d.products?.map(p => p.id) ?? d.products ?? []) as number[],
    });
    this.isFormOpen = true;
  }

  cancel() {
    this.isFormOpen = false;
    this.submitted.set(false);
    this.error.set(null);
  }

  // --- Builders ---
  private buildCreate(): CreateDistributorDTO {
    const v = this.form.getRawValue();
    const ids = Array.isArray(v.productsIds) ? v.productsIds.map(Number).filter(n => !Number.isNaN(n)) : [];
    return {
      dni: String(v.dni).trim(),
      name: String(v.name).trim(),
      phone: String(v.phone).trim(),
      email: String(v.email).trim(),
      address: String(v.address || '').trim(),
      zoneId: Number(v.zoneId),
      productsIds: ids,
    };
  }

  private buildUpdate(): PatchDistributorDTO {
    const v = this.form.getRawValue();
    const patch: PatchDistributorDTO = {};
    if (this.form.controls.name.dirty) patch.name = String(v.name).trim();
    if (this.form.controls.phone.dirty) patch.phone = String(v.phone).trim();
    if (this.form.controls.email.dirty) patch.email = String(v.email).trim();
    if (this.form.controls.address.dirty) patch.address = String(v.address || '').trim();
    if (this.form.controls.zoneId.dirty && v.zoneId != null) patch.zoneId = Number(v.zoneId);
    if (this.form.controls.productsIds.dirty) patch.productsIds = (v.productsIds || []).map(Number).filter(n => !Number.isNaN(n));
    return patch;
  }

  // --- Guardado ---
  save() {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.error.set(this.t.instant('distributors.form.err.fill'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!this.isEdit()) {
      const payload = this.buildCreate();
      this.srv.create(payload).subscribe({
        next: () => { this.cancel(); this.load(); },
        error: (err) => { this.error.set(err?.error?.message || this.t.instant('distributors.errorCreate')); this.loading.set(false); }
      });
      return;
    }

    const dni = String(this.form.controls.dni.value);
    const patch = this.buildUpdate();
    this.srv.update(dni, patch).subscribe({
      next: () => { this.cancel(); this.load(); },
      error: (err) => { this.error.set(err?.error?.message || this.t.instant('distributors.errorSave')); this.loading.set(false); }
    });
  }

  // --- Borrado ---
  delete(dni: string | number) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(String(dni)).subscribe({
      next: () => this.load(),
      error: (err) => { this.error.set(err?.error?.message || this.t.instant('distributors.errorDelete')); this.loading.set(false); }
    });
  }
}
