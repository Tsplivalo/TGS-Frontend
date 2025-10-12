import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, Validators, FormGroup, FormControl
} from '@angular/forms';

import { SaleService } from '../../services/sale/sale';
import { ProductService } from '../../services/product/product';
import { ClientService } from '../../services/client/client';

import {
  SaleDTO, CreateSaleDTO, ApiResponse as ApiSaleResp, SaleDetailDTO, SaleClientDTO
} from '../../models/sale/sale.model';
import { ProductDTO, ApiResponse as ApiProdResp } from '../../models/product/product.model';
import { ClientDTO, ApiResponse as ApiCliResp } from '../../models/client/client.model';

import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * SaleComponent
 *
 * Crea ventas con múltiples líneas, mostrando un listado filtrable y calculando totales
 * aun cuando el backend use distintas formas de retorno (amount/total/subtotales). Usa
 * signals para estado, formularios reactivos, y i18n para errores.
 */

type SaleForm = {
  id: FormControl<number | null>;
  clientDni: FormControl<string | null>;
  productId: FormControl<number | null>;
  quantity: FormControl<number>;
};

type Line = { productId: number | null; quantity: number; filter?: string };

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './sale.html',
  styleUrls: ['./sale.scss'],
})
export class SaleComponent implements OnInit {
  // --- Inyección ---
  private fb = inject(FormBuilder);
  private saleSrv = inject(SaleService);
  private prodSrv = inject(ProductService);
  private cliSrv = inject(ClientService);
  private t = inject(TranslateService);

  // --- Estado base ---
  sales = signal<SaleDTO[]>([]);
  products = signal<ProductDTO[]>([]);
  clients = signal<ClientDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // --- Filtros de listado ---
  fText = '';
  fClientDni = '';

  // --- Filtros de selects ---
  productFilter = '';
  clientFilter = '';

  // --- Líneas de la venta en edición ---
  lines = signal<Line[]>([{ productId: null, quantity: 1, filter: '' }]);

  // --- Form reactivo (cabecera) ---
  form: FormGroup<SaleForm> = this.fb.group<SaleForm>({
    id: this.fb.control<number | null>(null),
    clientDni: this.fb.control<string | null>(null, { validators: [Validators.required, Validators.minLength(6)] }),
    productId: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    quantity: this.fb.nonNullable.control(1, { validators: [Validators.min(1)] }),
  });

  // --- UI: abrir/cerrar sección "nueva venta" ---
  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }

  // Expuesto al template
  get clientControl() { return this.form.controls.clientDni; }

  // --- Ciclo de vida ---
  ngOnInit(): void {
    // Carga catálogo (productos + clientes) antes de traer ventas
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      prods: this.prodSrv.getAllProducts(),
      clis: this.cliSrv.getAllClients(),
    }).subscribe({
      next: (res: { prods: ApiProdResp<ProductDTO[]> | any; clis: ApiCliResp<ClientDTO[]> | any }) => {
        const productList = (res.prods?.data ?? res.prods?.products ?? []) as ProductDTO[];
        const clientList  = (res.clis?.data  ?? res.clis?.clients  ?? []) as ClientDTO[];
        this.products.set(productList);
        this.clients.set(clientList);
        this.loadSales();
      },
      error: () => { this.loadSales(); }
    });
  }

  // --- Stock y cantidades ---
  getStock(id: number | null | undefined): number {
    if (id == null) return 0;
    const p = this.products().find(x => x.id === id);
    const raw = p?.stock;
    const n = typeof raw === 'string' ? Number(raw) : (typeof raw === 'number' ? raw : 0);
    return Number.isFinite(n) ? n : 0;
  }

  clampQuantity(idx: number) {
    const arr = [...this.lines()];
    const l = arr[idx];
    const max = this.getStock(l.productId);
    let val = Number(l.quantity) || 1;
    if (val < 1) val = 1;
    if (max > 0 && val > max) val = max;
    l.quantity = val;
    this.lines.set(arr);
  }

  // --- Listado filtrado ---
  filteredSales = computed(() => {
    const q = (this.fText || '').toLowerCase().trim();
    const dni = (this.fClientDni || '').trim();
    return this.sales().filter(v => {
      const saleDescription = (v.product && v.product.description) ? v.product.description.toLowerCase() : '';
      let hasText = (!q) || saleDescription.includes(q) || String(v.id).includes(q);
      if (!hasText && v.details && v.details.length) {
        for (const d of v.details) {
          const dd = this.detailDescription(d).toLowerCase();
          if (dd.includes(q)) { hasText = true; break; }
        }
      }
      const matchDni = !dni || (v.client && v.client.dni ? v.client.dni.includes(dni) : false);
      return (q ? hasText : true) && matchDni;
    });
  });

  filteredProductsBy = (filter: string) => {
    const q = (filter || '').toLowerCase().trim();
    if (!q) return this.products();
    return this.products().filter(p =>
      String(p.id).includes(q) || ((p.description || '').toLowerCase().includes(q))
    );
  };

  filteredClients = computed(() => {
    const q = (this.clientFilter || '').toLowerCase().trim();
    if (!q) return this.clients();
    return this.clients().filter(c =>
      (c.dni || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q)
    );
  });

  // --- Data fetching ---
  loadSales() {
    this.saleSrv.getAllSales().subscribe({
      next: (res: ApiSaleResp<SaleDTO[]> | any) => {
        const list = (res?.data ?? res?.sales ?? []) as SaleDTO[];
        this.sales.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.t.instant('sales.errorLoad'));
        this.loading.set(false);
      }
    });
  }

  // --- Agregados y descripciones ---
  sumQuantities(v: SaleDTO): number {
    const details = this.getDetails(v) ?? [];
    let total = 0;
    for (let i = 0; i < details.length; i++) {
      const quantity = Number((details[i] as any)?.quantity);
      if (Number.isFinite(quantity)) total += quantity;
    }
    return total;
  }

  private getProdById(id: number | null | undefined): ProductDTO | undefined {
    if (id == null) return undefined;
    return this.products().find(p => p.id === id);
  }

  detailDescription(d: SaleDetailDTO): string {
    if (d?.product?.description) return d.product.description;
    const pid = (d as any)?.productId ?? (d as any)?.product?.id ?? null;
    if (pid != null) {
      const p = this.products().find(x => x.id === Number(pid));
      if (p?.description) return p.description;
      return `#${pid}`;
    }
    return '—';
  }

  detailPrice(d: SaleDetailDTO): number {
    const sub = (d as any).subtotal;
    if (typeof sub === 'number' && Number.isFinite(sub)) return sub / (Number(d.quantity) || 1);
    if (d.product && typeof d.product.price === 'number') return d.product.price;
    const p = this.getProdById(d.productId);
    const raw = p && (p as any).price;
    const num = typeof raw === 'string' ? Number(raw) : (typeof raw === 'number' ? raw : 0);
    return Number.isFinite(num) ? num : 0;
  }

  getClient(v: SaleDTO): SaleClientDTO | null { return v.client ? v.client : null; }
  hasDetails(v: SaleDTO): boolean { return !!(v.details && v.details.length > 0); }
  getDetails(v: SaleDTO): SaleDetailDTO[] { return v.details ? v.details : []; }
  getProductDesc(v: SaleDTO): string {
    if (v.product && typeof v.product.description === 'string') return v.product.description;
    const p = v.product?.id ? this.getProdById(v.product.id) : undefined;
    return p?.description ?? '—';
  }

  // --- Validaciones de entrada ---
  private clientExists(dni: string | null): boolean {
    if (!dni) return false;
    return this.clients().some(c => (c.dni || '') === dni);
  }

  private buildCreatePayload(): CreateSaleDTO {
    const dni = String(this.clientControl.value || '').trim();
    const details: SaleDetailDTO[] = this.lines().map(l => ({
      productId: Number(l.productId),
      quantity: Number(l.quantity),
    }));
    return { clientDni: dni, details };
  }

  private validateLines(lines: Line[]): string | null {
    if (!lines || lines.length === 0) return this.t.instant('sales.err.addOne');
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.productId == null) return this.t.instant('sales.err.chooseProductLine', { n: i + 1 });
      const quantity = Number(l.quantity);
      if (!quantity || quantity < 1) return this.t.instant('sales.err.validQtyLine', { n: i + 1 });
      const stock = this.getStock(l.productId);
      if (quantity > stock) return this.t.instant('sales.err.noStock', { stock });
    }
    return null;
  }

  // Total de una venta compatible con distintos esquemas ({amount}|{total}|subtotales)
  calculateTotal(v: SaleDTO): number {
    const candidates = [(v as any).amount, (v as any).saleAmount, (v as any).total];
    for (const x of candidates) {
      if (typeof x === 'number' && Number.isFinite(x)) return x;
      if (typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x))) return Number(x);
    }
    if (v.details && v.details.length) {
      let sum = 0;
      for (const d of v.details) {
        const sub = (d as any).subtotal;
        if (typeof sub === 'number' && Number.isFinite(sub)) sum += sub;
        else {
          const price = this.detailPrice(d);
          const quantity = Number(d.quantity) || 0;
          sum += price * quantity;
        }
      }
      return sum;
    }
    let price = 0;
    if (v.product && typeof v.product.price === 'number') price = v.product.price;
    else if (v.product?.id) {
      const p = this.getProdById(v.product.id);
      const raw = p && (p as any).price;
      price = typeof raw === 'string' ? Number(raw) : (typeof raw === 'number' ? raw : 0);
    }
    const quantity = typeof v.quantity === 'number' ? v.quantity : Number((v as any).quantity) || 0;
    return (Number.isFinite(price) ? price : 0) * quantity;
  }

  // --- Form helpers ---
  new() {
    this.form.reset({ id: null, clientDni: null, productId: null, quantity: 1 });
    this.lines.set([{ productId: null, quantity: 1, filter: '' }]);
    this.submitted.set(false);
    this.error.set(null);
  }

  addLine() {
    const arr = [...this.lines()];
    arr.push({ productId: null, quantity: 1, filter: '' });
    this.lines.set(arr);
  }
  removeLine(idx: number) {
    const arr = [...this.lines()];
    arr.splice(idx, 1);
    if (arr.length === 0) arr.push({ productId: null, quantity: 1, filter: '' });
    this.lines.set(arr);
  }

  // --- Guardado (create) ---
  save() {
    this.submitted.set(true);
    const dni = this.clientControl.value;

    if (!this.clientExists(dni)) {
      this.error.set(this.t.instant('sales.err.clientMissing'));
      this.clientControl.markAsTouched();
      return;
    }

    const errLines = this.validateLines(this.lines());
    if (errLines) { this.error.set(errLines); return; }

    this.loading.set(true);
    this.error.set(null);

    const payload = this.buildCreatePayload();
    this.saleSrv.createSale(payload).subscribe({
      next: () => { this.new(); this.loadSales(); },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('sales.err.create');
        this.error.set(msg);
        this.loading.set(false);
        console.error('[SALE] Error creating:', err);
      }
    });
  }
}
