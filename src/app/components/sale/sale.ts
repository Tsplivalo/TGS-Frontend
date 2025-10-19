import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, Validators, FormGroup, FormControl
} from '@angular/forms';

import { SaleService } from '../../services/sale/sale';
import { ProductService } from '../../services/product/product';
import { ClientService } from '../../services/client/client';
import { StatsService, SalesStats } from '../../services/stats/stats'; // ⬅ NUEVO

import {
  SaleDTO, CreateSaleDTO, ApiResponse as ApiSaleResp, SaleDetailDTO, SaleClientDTO
} from '../../models/sale/sale.model';
import { ProductDTO, ApiResponse as ApiProdResp } from '../../models/product/product.model';
import { ClientDTO, ApiResponse as ApiCliResp } from '../../models/client/client.model';

import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ChartComponent } from '../chart/chart'; // ⬅ NUEVO
import { ChartConfiguration } from 'chart.js'; // ⬅ NUEVO

type SaleForm = {
  id: FormControl<number | null>;
  clientDni: FormControl<string | null>;
  distributorDni: FormControl<string | null>;
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
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    TranslateModule,
    ChartComponent // ⬅ NUEVO
  ],
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
  private statsSrv = inject(StatsService); // ⬅ NUEVO

  // --- Estado base ---
  sales = signal<SaleDTO[]>([]);
  products = signal<ProductDTO[]>([]);
  clients = signal<ClientDTO[]>([]);
  distributors = signal<DistributorDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // --- Stats y Charts (NUEVO) ---
  stats = signal<SalesStats | null>(null);
  loadingStats = signal(false);
  showStats = signal(false); // Toggle para mostrar/ocultar estadísticas
  
  salesChartData = signal<ChartConfiguration['data'] | null>(null);
  topProductsChartData = signal<ChartConfiguration['data'] | null>(null);
  distributorsChartData = signal<ChartConfiguration['data'] | null>(null);

  // --- Filtros de listado ---
  fTextInput = signal('');
  fTextApplied = signal('');
  fClientDniInput = signal('');
  fClientDniApplied = signal('');

  // --- Filtros de selects ---
  productFilter = '';
  clientFilter = '';
  distributorFilter = '';

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
      validators: [Validators.required, Validators.minLength(6)]
    }),
    productId: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    quantity: this.fb.nonNullable.control(1, { validators: [Validators.min(1)] }),
  });

  // --- UI: abrir/cerrar secciones ---
  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }
  
  // ⬅ NUEVO: Toggle para estadísticas
  toggleStats() {
    const newValue = !this.showStats();
    console.log('🔄 Toggle stats:', { 
      before: this.showStats(), 
      after: newValue,
      hasStats: !!this.stats()
    });
    this.showStats.set(newValue);
    
    if (newValue && !this.stats()) {
      console.log('📊 Loading stats for first time...');
      this.loadStats();
    }
  }

  // Expuesto al template
  get clientControl() { return this.form.controls.clientDni; }
  get distributorControl() { return this.form.controls.distributorDni; }



  
  // --- Ciclo de vida ---
  ngOnInit(): void {
    console.log('🚀 Component initialized. showStats:', this.showStats());
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      prods: this.prodSrv.getAllProducts(),
      clis: this.cliSrv.getAllClients(),
      dists: this.http.get<any>('/api/distributors', { withCredentials: true }), // ⬅ Agregar withCredentials
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
        
        this.loadSales();
      },
      error: (err) => { 
        console.error('❌ Error loading catalog:', err);
        this.loadSales(); 
      }
    });
  }

  // ⬅ NUEVO: Cargar estadísticas desde los datos locales
  loadStats() {
    console.log('📊 loadStats() called');
    this.loadingStats.set(true);
    
    // Calcular estadísticas desde los datos de ventas existentes
    const salesData = this.sales();
    
    if (!salesData || salesData.length === 0) {
      console.warn('⚠️ No sales data available');
      this.loadingStats.set(false);
      return;
    }

    // Calcular totales
    const totalRevenue = salesData.reduce((sum, sale) => sum + this.calculateTotal(sale), 0);
    const totalSales = salesData.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Agrupar ventas por mes
    const salesByMonth = this.groupSalesByMonth(salesData);

    // Top productos más vendidos
    const topProducts = this.getTopProducts(salesData);

    // Ventas por distribuidor
    const salesByDistributor = this.getSalesByDistributor(salesData);

    const stats: SalesStats = {
      totalSales,
      totalRevenue,
      averageTicket,
      salesByMonth,
      topProducts,
      salesByDistributor
    };

    // Convertir a formato de gráficos
    const salesChartData: ChartConfiguration['data'] = {
      labels: salesByMonth.map(s => s.month),
      datasets: [{
        label: 'Ventas ($)',
        data: salesByMonth.map(s => s.amount),
        backgroundColor: 'rgba(195, 164, 98, 0.8)',
        borderColor: 'rgba(195, 164, 98, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    };

    const productsChartData: ChartConfiguration['data'] = {
      labels: topProducts.map(p => p.productName),
      datasets: [{
        label: 'Cantidad Vendida',
        data: topProducts.map(p => p.quantity),
        backgroundColor: [
          'rgba(195, 164, 98, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(156, 163, 175, 0.6)'
        ],
        borderColor: [
          'rgba(195, 164, 98, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(156, 163, 175, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 8
      }]
    };

    const distributorsChartData: ChartConfiguration['data'] = {
      labels: salesByDistributor.map(d => d.distributorName),
      datasets: [{
        label: 'Ventas Totales ($)',
        data: salesByDistributor.map(d => d.totalSales),
        backgroundColor: 'rgba(195, 164, 98, 0.8)',
        borderColor: 'rgba(195, 164, 98, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    };

    console.log('✅ Stats calculated:', stats);
    
    this.stats.set(stats);
    this.salesChartData.set(salesChartData);
    this.topProductsChartData.set(productsChartData);
    this.distributorsChartData.set(distributorsChartData);
    this.loadingStats.set(false);
  }

  // Agrupar ventas por mes
  private groupSalesByMonth(sales: SaleDTO[]): { month: string; amount: number }[] {
    const monthMap = new Map<string, number>();
    
    console.log('📅 Grouping sales by month...');
    
    sales.forEach(sale => {
      const date = new Date(sale.saleDate || sale.date || Date.now());
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const monthKey = `${year}-${String(month).padStart(2, '0')}`; // "2025-10"
      
      const saleTotal = this.calculateTotal(sale);
      const currentAmount = monthMap.get(monthKey) || 0;
      
      console.log(`  Sale #${sale.id}: ${monthKey} -> ${saleTotal} (accumulated: ${currentAmount + saleTotal})`);
      
      monthMap.set(monthKey, currentAmount + saleTotal);
    });

    console.log('📅 Month map final:', Array.from(monthMap.entries()));

    // Convertir el Map a array y ordenar por fecha
    const result = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Ordenar por key "2025-10"
      .map(([key, amount]) => {
        const [year, monthNum] = key.split('-');
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return {
          month: `${monthNames[parseInt(monthNum)]} ${year}`,
          amount
        };
      });
    
    console.log('📅 Final result:', result);
    return result;
  }

  // Obtener top 5 productos más vendidos
  private getTopProducts(sales: SaleDTO[]): { productId: number; productName: string; quantity: number }[] {
    const productMap = new Map<number, { name: string; quantity: number }>();

    console.log('📦 Calculating top products from', sales.length, 'sales');

    sales.forEach(sale => {
      if (sale.details && sale.details.length > 0) {
        sale.details.forEach(detail => {
          const productId = detail.productId;
          const quantity = Number(detail.quantity) || 0;
          const productName = this.detailDescription(detail);

          console.log(`  - Product ${productId} (${productName}): +${quantity} units`);

          if (productMap.has(productId)) {
            const existing = productMap.get(productId)!;
            existing.quantity += quantity;
            console.log(`    Updated total for ${productName}: ${existing.quantity} units`);
          } else {
            productMap.set(productId, { name: productName, quantity });
            console.log(`    New product ${productName}: ${quantity} units`);
          }
        });
      }
    });

    const result = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log('🏆 Top products result:', result);
    return result;
  }

  // Obtener ventas por distribuidor
  private getSalesByDistributor(sales: SaleDTO[]): { distributorName: string; totalSales: number }[] {
    const distributorMap = new Map<string, number>();

    console.log('🚚 Calculating sales by distributor from', sales.length, 'sales');

    sales.forEach(sale => {
      const distributorName = sale.distributor?.name || 'Sin distribuidor';
      const currentAmount = distributorMap.get(distributorName) || 0;
      const saleTotal = this.calculateTotal(sale);
      
      distributorMap.set(distributorName, currentAmount + saleTotal);
      console.log(`  - ${distributorName}: +${saleTotal} (total: ${currentAmount + saleTotal})`);
    });

    const result = Array.from(distributorMap.entries())
      .map(([distributorName, totalSales]) => ({ distributorName, totalSales }))
      .sort((a, b) => b.totalSales - a.totalSales);

    console.log('🚚 Distributors result:', result);
    return result;
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
      const saleDescription = (v.details && v.details.length) 
        ? v.details.map(d => this.detailDescription(d)).join(' ').toLowerCase()
        : '';
      
      const clientName = v.client?.name?.toLowerCase() || '';
      const clientDni = v.client?.dni || '';
      const distributorName = v.distributor?.name?.toLowerCase() || '';
      
      const hasText = (!q) || 
        saleDescription.includes(q) || 
        String(v.id).includes(q) ||
        clientName.includes(q) ||
        clientDni.includes(q) ||
        distributorName.includes(q);
      
      const matchDni = !dni || clientDni.includes(dni);
      
      return hasText && matchDni;
    });
  });

  filteredProductsBy(filter: string): ProductDTO[] {
    const allProds = this.products();
    const q = (filter || '').toLowerCase().trim();
    
    if (!q || q === '') {
      return allProds;
    }
    
    return allProds.filter(p => {
      const matchId = String(p.id).includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      return matchId || matchDesc;
    });
  }

  filteredClients = computed(() => {
    const q = (this.clientFilter || '').toLowerCase().trim();
    if (!q) return this.clients();
    return this.clients().filter(c =>
      (c.dni || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q)
    );
  });

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
        console.log('📋 Sales loaded:', list.length, 'sales');
        
        // ⬅ NUEVO: Debug - ver la estructura de las ventas
        if (list.length > 0) {
          console.log('🔍 First sale structure:', list[0]);
          console.log('🔍 Distributor in first sale:', list[0].distributor);
          console.log('🔍 Client in first sale:', list[0].client);
        }
        
        this.sales.set(list);
        this.loading.set(false);
        
        // ⬅ NUEVO: Cargar stats automáticamente al cargar ventas
        if (list.length > 0) {
          console.log('📊 Auto-loading stats because sales exist');
          this.showStats.set(true);
          this.loadStats();
        }
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
  
  // ⬅ NUEVO: Helper para buscar distribuidor por ID
  getDistributorById(id: string): DistributorDTO | undefined {
    return this.distributors().find(d => d.dni === id || (d as any).id === id);
  }

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
      distributorDni,
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

  calculateTotal(v: SaleDTO): number {
    if (typeof v.saleAmount === 'number') return v.saleAmount;
    if (typeof v.amount === 'number') return v.amount;
    if (typeof v.total === 'number') return v.total;

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
    
    const clientDni = this.clientControl.value;
    if (!this.clientExists(clientDni)) {
      this.error.set(this.t.instant('sales.err.clientMissing'));
      this.clientControl.markAsTouched();
      return;
    }

    const distributorDni = this.distributorControl.value;
    if (!this.distributorExists(distributorDni)) {
      this.error.set(this.t.instant('sales.err.distributorMissing'));
      this.distributorControl.markAsTouched();
      return;
    }

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
        // ⬅ Recargar stats después de crear una venta si están visibles
        if (this.showStats() && this.stats()) {
          setTimeout(() => this.loadStats(), 500); // Delay para que se carguen las ventas primero
        }
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