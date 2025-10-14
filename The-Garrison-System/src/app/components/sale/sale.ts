import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SaleService } from '../../services/sale/sale';
import { ProductService } from '../../services/product/product';
import { ClientService } from '../../services/client/client';

import { SaleDTO, CreateSaleDTO } from '../../models/sale/sale.model';
import { ProductDTO } from '../../models/product/product.model';
import { ClientDTO } from '../../models/client/client.model';

type Line = { filter?: string; productId: number | null; quantity: number };

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './sale.html',
  styleUrls: ['./sale.scss'],
})
export class SaleComponent implements OnInit {

  private fb = inject(FormBuilder);
  private saleSrv = inject(SaleService);
  private prodSrv = inject(ProductService);
  private cliSrv  = inject(ClientService);
  private t = inject(TranslateService);

  // data
  sales = signal<SaleDTO[]>([]);
  clients = signal<ClientDTO[]>([]);
  products = signal<ProductDTO[]>([]);

  // ui state
  loading = signal(false);
  error = signal<string | null>(null);
  isNewOpen = false;

  // list filters
  fText = '';
  fClientDni = '';

  // create form filters
  clientFilter = '';

  // líneas dinámicas del formulario (usadas por el template con ngModel)
  private _lines = signal<Line[]>([{ filter: '', productId: null, quantity: 1 }]);
  lines = () => this._lines();

  form = this.fb.group({
    clientDni: ['', Validators.required],
    // NOTA: Dejo el FormArray para compatibilidad, pero el template usa `lines` con ngModel.
    // En save() construyo el payload desde `lines()` (más robusto).
    details: this.fb.array([
      this.fb.group({
        productId: [null, Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
      }),
    ])
  });

  get details(): FormArray { return this.form.get('details') as FormArray; }

  ngOnInit() {
    this.loadSales();
    this.loadClients();
    this.loadProducts();
  }

  // ---------- CARGAS ----------
  loadSales() {
    this.loading.set(true);
    this.error.set(null);
    this.saleSrv.list().subscribe({
      next: (list) => { this.sales.set(list ?? []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message || this.t.instant('sales.err.load')); this.loading.set(false); }
    });
  }

  loadClients() {
    this.cliSrv.getAllClients().subscribe({
      next: (list) => this.clients.set(list ?? []),
      error: () => {} // no bloqueo UI
    });
  }

  loadProducts(query?: string) {
    const obs = query ? this.prodSrv.search(query, 'description') : this.prodSrv.list();
    obs.subscribe({
      next: (list) => this.products.set(list ?? []),
      error: () => {}
    });
  }

  // ---------- COLLAPSIBLE ----------
  toggleNew() { this.isNewOpen = !this.isNewOpen; }

  // ---------- LÍNEAS ----------
  addLine() {
    this._lines.update(arr => [...arr, { filter: '', productId: null, quantity: 1 }]);
    // mantengo el FormArray sincronizado de forma básica
    this.details.push(this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
    }));
  }

  removeLine(ix: number) {
    const arr = this._lines();
    if (arr.length <= 1) return;
    this._lines.set(arr.filter((_, i) => i !== ix));
    if (this.details.length > ix) this.details.removeAt(ix);
  }

  filteredProductsBy(filter: string): ProductDTO[] {
    const term = (filter || '').toLowerCase().trim();
    const list = this.products();
    if (!term) return list;
    return list.filter(p =>
      (p.description ?? '').toLowerCase().includes(term) ||
      String(p.id).includes(term)
    );
    // Si querés búsqueda server-side, acá podrías disparar this.loadProducts(term)
  }

  getStock(productId: number | null | undefined): number | null {
    if (!productId) return null;
    const p = this.products().find(x => x.id === productId);
    return p ? Number(p.stock ?? 0) : null;
  }

  clampQuantity(ix: number) {
    const arr = this._lines();
    const line = arr[ix];
    if (!line) return;
    let q = Number(line.quantity || 1);
    if (!Number.isFinite(q) || q < 1) q = 1;
    const max = this.getStock(line.productId);
    if (Number.isFinite(max as any) && max != null) q = Math.min(q, max as number);
    arr[ix] = { ...line, quantity: q };
    this._lines.set([...arr]);
  }

  // ---------- FILTROS LISTA ----------
  filteredClients(): ClientDTO[] {
    const term = (this.clientFilter || '').toLowerCase().trim();
    if (!term) return this.clients();
    return this.clients().filter(c =>
      (c.dni ?? '').toLowerCase().includes(term) ||
      (c.name ?? '').toLowerCase().includes(term)
    );
  }

  filteredSales(): SaleDTO[] {
    const text = (this.fText || '').toLowerCase().trim();
    const dni  = (this.fClientDni || '').toLowerCase().trim();
    return this.sales().filter(v => {
      const matchesText = !text || JSON.stringify(v).toLowerCase().includes(text);
      const matchesDni  = !dni  || String((v as any).clientDni ?? '').toLowerCase().includes(dni);
      return matchesText && matchesDni;
    });
  }

  // ---------- HELPERS TABLA ----------
  getClient(v: SaleDTO): ClientDTO | null {
    const dni = (v as any).clientDni ?? (v as any).client?.dni;
    if (!dni) return null;
    return this.clients().find(c => c.dni === dni) ?? null;
  }

  hasDetails(v: SaleDTO): boolean {
    return Array.isArray((v as any).details) && (v as any).details.length > 0;
  }

  getDetails(v: SaleDTO): Array<{ productId: number; quantity: number }> {
    return (this.hasDetails(v) ? (v as any).details : []) as Array<{ productId: number; quantity: number }>;
  }

  detailDescription(d: { productId: number; quantity: number }): string {
    const p = this.products().find(x => x.id === d.productId);
    const desc = p?.description ?? `#${d.productId}`;
    return `${desc} × ${d.quantity}`;
  }

  sumQuantities(v: SaleDTO): number {
    if (this.hasDetails(v)) {
      return this.getDetails(v).reduce((acc, it) => acc + Number(it.quantity || 0), 0);
    }
    return Number((v as any).quantity || 0);
  }

  calculateTotal(v: SaleDTO): number {
    if (this.hasDetails(v)) {
      return this.getDetails(v).reduce((acc, it) => {
        const p = this.products().find(x => x.id === it.productId);
        const price = Number(p?.price ?? 0);
        const qty = Number(it.quantity ?? 0);
        return acc + price * qty;
      }, 0);
    }
    // Soporte legado: price * quantity
    const price = Number((v as any).price ?? 0);
    const qty   = Number((v as any).quantity ?? 0);
    return price * qty;
  }


    // Devuelve una descripción legible cuando la venta NO trae details (soporte legacy)
  getProductDesc(v: SaleDTO): string {
    const anyV = v as any;

    // 1) Si viene un productId suelto, buscamos en el catálogo actual
    if (anyV?.productId != null) {
      const pid = Number(anyV.productId);
      const p = this.products().find(x => x.id === pid);
      if (p?.description) return p.description;

      // fallback: si el back mandó productDescription
      if (typeof anyV.productDescription === 'string' && anyV.productDescription.trim()) {
        return anyV.productDescription.trim();
      }
      return `#${pid}`;
    }

    // 2) Si vino un campo productDescription suelto
    if (typeof anyV?.productDescription === 'string' && anyV.productDescription.trim()) {
      return anyV.productDescription.trim();
    }

    // 3) Último recurso
    return '—';
  }


  // ---------- NUEVO / SAVE ----------
  new() {
    this.form.reset({ clientDni: '', details: [] });
    // reset de líneas y formarray
    this._lines.set([{ filter: '', productId: null, quantity: 1 }]);
    this.details.clear();
    this.details.push(this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
    }));
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    // construyo payload desde `lines()` (que es lo que edita el template)
    const rawClient = this.form.getRawValue().clientDni;
    const payload: CreateSaleDTO = {
      clientDni: String(rawClient),
      details: this.lines()
        .filter(l => l.productId != null)
        .map(l => ({
          productId: Number(l.productId),
          quantity: Math.max(1, Number(l.quantity || 1)),
        }))
    };

    this.saleSrv.createSale(payload).subscribe({
      next: () => { this.new(); this.loadSales(); },
      error: (err) => {
        this.error.set(err?.error?.message || this.t.instant('sales.err.create'));
        this.loading.set(false);
      }
    });
  }
}
