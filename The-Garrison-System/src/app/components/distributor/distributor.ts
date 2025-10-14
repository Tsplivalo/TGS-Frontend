import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DistributorService } from '../../services/distributor/distributor';
import { ZoneService } from '../../services/zone/zone';
import { ProductService } from '../../services/product/product';
import { ClientService } from '../../services/client/client';

import { ZoneDTO } from '../../models/zone/zona.model';
import { ProductDTO } from '../../models/product/product.model';
import { ClientDTO } from '../../models/client/client.model';
import { DistributorDTO, CreateDistributorDTO, PatchDistributorDTO } from '../../models/distributor/distributor.model';

type DistForm = {
  dni: FormControl<string>;
  name: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
  address: FormControl<string>;
  zoneId: FormControl<number | null>;
  productsIds: FormControl<number[]>;
  fromClientDni: FormControl<string | null>; // NUEVO: prefillear desde cliente
};

@Component({
  selector: 'app-distributor',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './distributor.html',
  styleUrls: ['./distributor.scss'],
})
export class DistributorComponent implements OnInit {

  private fb = inject(FormBuilder);
  private t = inject(TranslateService);
  private srv = inject(DistributorService);
  private zoneSrv = inject(ZoneService);
  private prodSrv = inject(ProductService);
  private clientSrv = inject(ClientService);

  items = signal<DistributorDTO[]>([]);
  zones = signal<ZoneDTO[]>([]);
  products = signal<ProductDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  editDni = signal<string | null>(null);

  form: FormGroup<DistForm> = this.fb.nonNullable.group({
    dni: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    phone: this.fb.nonNullable.control(''),
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    address: this.fb.nonNullable.control(''),
    zoneId: this.fb.control<number | null>(null),
    productsIds: this.fb.nonNullable.control<number[]>([]),
    fromClientDni: this.fb.control<string | null>(null), // NUEVO
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.list().subscribe({
      next: (list) => { this.items.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message ?? 'distributors.err.load'); this.loading.set(false); }
    });
    this.zoneSrv.list().subscribe({ next: (z) => this.zones.set(z) });
    this.prodSrv.list().subscribe({ next: (p) => this.products.set(p) });
  }

  new() {
    this.editDni.set(null);
    this.form.reset({
      dni: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      zoneId: null,
      productsIds: [],
      fromClientDni: null
    });
  }

  edit(d: DistributorDTO) {
    this.editDni.set(d.dni);
    this.form.reset({
      dni: d.dni,
      name: d.name,
      phone: d.phone ?? '',
      email: d.email ?? '',
      address: d.address ?? '',
      zoneId: d.zoneId ?? null,
      productsIds: (d.products ?? []).map(p => p.id),
      fromClientDni: null
    });
  }

  prefFillFromClient() {
    const dni = this.form.controls.fromClientDni.value;
    if (!dni) return;
    this.clientSrv.getClientByDni(dni).subscribe({
      next: (c: ClientDTO) => {
        this.form.patchValue({
          dni: c.dni,
          name: c.name ?? '',
          email: c.email ?? '',
          address: c.address ?? '',
          phone: c.phone ?? ''
        });
      },
      error: () => {}
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const body: CreateDistributorDTO | PatchDistributorDTO = {
      dni: String(raw.dni),
      name: String(raw.name),
      phone: String(raw.phone ?? ''),
      email: String(raw.email ?? ''),
      address: String(raw.address ?? ''),
      zoneId: raw.zoneId != null ? Number(raw.zoneId) : (null as any),
      productsIds: (raw.productsIds ?? []).map(Number)
    } as any;

    const isEdit = this.editDni() != null;
    const req$ = isEdit
      ? this.srv.update(this.editDni()!, body as PatchDistributorDTO)
      : this.srv.create(body as CreateDistributorDTO);

    req$.subscribe({
      next: () => { this.new(); this.loadAll(); },
      error: (err) => { this.error.set(err?.error?.message ?? (isEdit ? 'distributors.err.update' : 'distributors.err.create')); this.loading.set(false); }
    });
  }

  remove(dni: string) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(dni).subscribe({
      next: () => { this.loading.set(false); this.loadAll(); },
      error: (err) => { this.error.set(err?.error?.message ?? 'distributors.err.delete'); this.loading.set(false); }
    });
  }
}
