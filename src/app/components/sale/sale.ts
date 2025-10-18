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
import { HttpClient } from '@angular/common/http';

/**
 * SaleComponent - CORREGIDO
 * 
 * Crea ventas con múltiples líneas, requiriendo clientDni Y distributorDni.
 */

type SaleForm = {
  id: FormControl<number | null>;
  clientDni: FormControl<string | null>;
  distributorDni: FormControl<string | null>; // ← NUEVO: requerido por backend
  productId: FormControl<number | null>;
  quantity: FormControl<number>;
};

type Line = { productId: number | null; quantity: number; filter?: string };

interface DistributorDTO {
  dni: string;
  name: string;
}

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
  private http = inject(HttpClient);
  private saleSrv = inject(SaleService);
  private prodSrv = inject(ProductService);
  private cliSrv = inject(ClientService);
  private t = inject(TranslateService);

  // --- Estado base ---
  sales = signal<SaleDTO[]>([]);
  products = signal<ProductDTO[]>([]);
  clients = signal<ClientDTO[]>([]);
  distributors = signal<DistributorDTO[]>([]); // ← NUEVO
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // --- Filtros de listado ---
  fTextInput = signal('');
  fTextApplied = signal('');
  fClientDniInput = signal('');
  fClientDniApplied = signal('');

  // --- Filtros de selects ---
  productFilter = '';
  clientFilter = '';
  distributorFilter = ''; // ← NUEVO

  // --- Líneas de la venta en edición ---
  lines = signal<Line[]>([{ productId: null, quantity: 1, filter: '' }]);

  totalSales = computed(() => this.sales().length);
  totalRevenue = computed(() => 
    this.sales().reduce((sum, v) => sum + this.calculateTotal(v), 0)
  );

  // --- Form reactivo (cabecera) ---
  form: FormGroup<SaleForm> = this.fb.group<SaleForm>({
    id: this.fb.control<number | null>(null),
    clientDni: this.fb.control<string | null>(null, { 
      validators: [Validators.required, Validators.minLength(6)] 
    }),
    distributorDni: this.fb.control<string | null>(null, { 
      validators: [Validators.required, Validators.minLength(6)] // ← NUEVO: requerido
    }),
    productId: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    quantity: this.fb.nonNullable.control(1, { validators: [Validators.min(1)] }),
  });

  // --- UI: abrir/cerrar sección "nueva venta" ---
  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }

  // Expuesto al template
  get clientControl() { return this.form.controls.clientDni; }
  get distributorControl() { return this.form.controls.distributorDni; }

  // --- Ciclo de vida ---
  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);

    

    // ✅ Cargar productos, clientes Y distributores
    forkJoin({
      prods: this.prodSrv.getAllProducts(),
      clis: this.cliSrv.getAllClients(),
      dists: this.http.get<any>('/api/distributors'),
    }).subscribe({
      next: (res: { 
        prods: ApiProdResp<ProductDTO[]> | any; 
        clis: ApiCliResp<ClientDTO[]> | any;
        dists: any;
      }) => {
        // Normalizar productos
        let productList: ProductDTO[] = [];
        if (Array.isArray(res.prods)) {
          productList = res.prods;
        } else if (res.prods?.data && Array.isArray(res.prods.data)) {
          productList = res.prods.data;
        } else if (res.prods?.products && Array.isArray(res.prods.products)) {
          productList = res.prods.products;
        }

        // Normalizar clientes
        let clientList: ClientDTO[] = [];
        if (Array.isArray(res.clis)) {
          clientList = res.clis;
        } else if (res.clis?.data && Array.isArray(res.clis.data)) {
          clientList = res.clis.data;
        } else if (res.clis?.clients && Array.isArray(res.clis.clients)) {
          clientList = res.clis.clients;
        }

        // Normalizar distribuidores
        let distributorList: DistributorDTO[] = [];
        if (Array.isArray(res.dists)) {
          distributorList = res.dists;
        } else if (res.dists?.data && Array.isArray(res.dists.data)) {
          distributorList = res.dists.data;
        } else if (res.dists?.distributors && Array.isArray(res.dists.distributors)) {
          distributorList = res.dists.distributors;
        }
        
        console.log('📦 Products loaded:', productList.length, productList);
        console.log('👥 Clients loaded:', clientList.length, clientList);
        console.log('🚚 Distributors loaded:', distributorList.length, distributorList);
        
        this.products.set(productList);
        this.clients.set(clientList);
        this.distributors.set(distributorList);
        
        console.log('✅ Products signal set:', this.products());
        
        this.loadSales();
      },
      error: (err) => { 
        console.error('❌ Error loading catalog:', err);
        this.loadSales(); 
      }
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
    const q = this.fTextApplied().toLowerCase().trim();
    const dni = this.fClientDniApplied().trim();
    
    return this.sales().filter(v => {
      // Buscar en descripción de productos
      const saleDescription = (v.details && v.details.length) 
        ? v.details.map(d => this.detailDescription(d)).join(' ').toLowerCase()
        : '';
      
      // Buscar en nombre y DNI del cliente
      const clientName = v.client?.name?.toLowerCase() || '';
      const clientDni = v.client?.dni || '';
      
      // Buscar en nombre del distribuidor
      const distributorName = v.distributor?.name?.toLowerCase() || '';
      
      const hasText = (!q) || 
        saleDescription.includes(q) || 
        String(v.id).includes(q) ||
        clientName.includes(q) ||        // ← NUEVO
        clientDni.includes(q) ||         // ← NUEVO
        distributorName.includes(q);     // ← NUEVO
      
      const matchDni = !dni || clientDni.includes(dni);
      
      return hasText && matchDni;
    });
  });

  // Método para filtrar productos (NO usar computed porque necesita parámetro)
  filteredProductsBy(filter: string): ProductDTO[] {
    const allProds = this.products();
    const q = (filter || '').toLowerCase().trim();
    
    console.log('🔍 filteredProductsBy called. Total products:', allProds.length, 'Filter:', q);
    
    if (!q || q === '') {
      console.log('✅ No filter, returning all', allProds.length, 'products');
      return allProds;
    }
    
    const filtered = allProds.filter(p => {
      const matchId = String(p.id).includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      return matchId || matchDesc;
    });
    
    console.log('✅ Filtered to', filtered.length, 'products');
    return filtered;
  }

  filteredClients = computed(() => {
    const q = (this.clientFilter || '').toLowerCase().trim();
    if (!q) return this.clients();
    return this.clients().filter(c =>
      (c.dni || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q)
    );
  });

  // ← NUEVO: Filtro de distribuidores
  filteredDistributors = computed(() => {
    const q = (this.distributorFilter || '').toLowerCase().trim();
    if (!q) return this.distributors();
    return this.distributors().filter(d =>
      (d.dni || '').toLowerCase().includes(q) ||
      (d.name || '').toLowerCase().includes(q)
    );
  });

  applyFilters() {
  this.fTextApplied.set(this.fTextInput());
  this.fClientDniApplied.set(this.fClientDniInput());
  }

  clearFilters() {
    this.fTextInput.set('');
    this.fClientDniInput.set('');
    this.fTextApplied.set('');
    this.fClientDniApplied.set('');
  }

  // --- Data fetching ---
  loadSales() {
    this.saleSrv.getAllSales().subscribe({
      next: (list: SaleDTO[]) => {
        this.sales.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.t.instant('sales.errorLoad'));
        this.loading.set(false);
      }
    });
  }

  // --- Helpers ---
  sumQuantities(v: SaleDTO): number {
    const details = this.getDetails(v) ?? [];
    return details.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  }

  private getProdById(id: number | null | undefined): ProductDTO | undefined {
    if (id == null) return undefined;
    return this.products().find(p => p.id === id);
  }

  detailDescription(d: SaleDetailDTO): string {
    if (d?.product?.description) return d.product.description;
    const pid = d.productId ?? (d as any)?.product?.id ?? null;
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
    return p?.price ?? 0;
  }

  getClient(v: SaleDTO): SaleClientDTO | null { return v.client ?? null; }
  hasDetails(v: SaleDTO): boolean { return !!(v.details && v.details.length > 0); }
  getDetails(v: SaleDTO): SaleDetailDTO[] { return v.details ?? []; }
  getProductDesc(v: SaleDTO): string { return '—'; } // Legacy, no se usa

  // --- Validaciones ---
  private clientExists(dni: string | null): boolean {
    if (!dni) return false;
    return this.clients().some(c => (c.dni || '') === dni);
  }

  private distributorExists(dni: string | null): boolean {
    if (!dni) return false;
    return this.distributors().some(d => (d.dni || '') === dni);
  }

  private buildCreatePayload(): CreateSaleDTO {
    const clientDni = String(this.clientControl.value || '').trim();
    const distributorDni = String(this.distributorControl.value || '').trim();
    
    const details: SaleDetailDTO[] = this.lines().map(l => ({
      productId: Number(l.productId),
      quantity: Number(l.quantity),
    }));

    return { 
      clientDni, 
      distributorDni, // ← NUEVO: requerido
      details 
    };
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

  // Total de una venta
  calculateTotal(v: SaleDTO): number {
    // Priorizar saleAmount que devuelve el backend
    if (typeof v.saleAmount === 'number') return v.saleAmount;
    if (typeof v.amount === 'number') return v.amount;
    if (typeof v.total === 'number') return v.total;

    // Calcular desde detalles
    if (v.details && v.details.length) {
      return v.details.reduce((sum, d) => {
        const sub = (d as any).subtotal;
        if (typeof sub === 'number') return sum + sub;
        const price = this.detailPrice(d);
        const quantity = Number(d.quantity) || 0;
        return sum + (price * quantity);
      }, 0);
    }

    return 0;
  }

  // --- Form helpers ---
  new() {
    this.form.reset({ 
      id: null, 
      clientDni: null, 
      distributorDni: null, 
      productId: null, 
      quantity: 1 
    });
    this.lines.set([{ productId: null, quantity: 1, filter: '' }]);
    this.submitted.set(false);
    this.error.set(null);
    this.isNewOpen = false;
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
    
    // ✅ Validar cliente
    const clientDni = this.clientControl.value;
    if (!this.clientExists(clientDni)) {
      this.error.set(this.t.instant('sales.err.clientMissing'));
      this.clientControl.markAsTouched();
      return;
    }

    // ✅ Validar distribuidor
    const distributorDni = this.distributorControl.value;
    if (!this.distributorExists(distributorDni)) {
      this.error.set(this.t.instant('sales.err.distributorMissing'));
      this.distributorControl.markAsTouched();
      return;
    }

    // ✅ Validar líneas
    const errLines = this.validateLines(this.lines());
    if (errLines) { 
      this.error.set(errLines); 
      return; 
    }

    this.loading.set(true);
    this.error.set(null);

    const payload = this.buildCreatePayload();
    
    this.saleSrv.createSale(payload).subscribe({
      next: () => { 
        this.new(); 
        this.loadSales(); 
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('sales.err.create');
        this.error.set(msg);
        this.loading.set(false);
        console.error('[SALE] Error creating:', err);
      }
    });
  }
}