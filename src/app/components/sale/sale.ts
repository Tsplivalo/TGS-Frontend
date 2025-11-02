import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, Validators, FormGroup, FormControl
} from '@angular/forms';

import { SaleService } from '../../services/sale/sale';
import { ProductService } from '../../services/product/product';
import { ClientService } from '../../services/client/client';
import { StatsService, SalesStats } from '../../services/stats/stats';
import { AuthService } from '../../services/auth/auth';
import { Role } from '../../models/user/user.model';

import {
  SaleDTO, CreateSaleDTO, ApiResponse as ApiSaleResp, SaleDetailDTO, SaleClientDTO
} from '../../models/sale/sale.model';
import { ProductDTO, ApiResponse as ApiProdResp } from '../../models/product/product.model';
import { ClientDTO, ApiResponse as ApiCliResp } from '../../models/client/client.model';

import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ChartComponent } from '../chart/chart';
import { ChartConfiguration } from 'chart.js';

type SaleForm = {
  id: FormControl<number | null>;
  clientDni: FormControl<string | null>;
  productId: FormControl<number | null>;
  quantity: FormControl<number>;
};

type ProductOffer = {
  productId: number;
  description: string;
  price: number;
  stock: number;
  distributorDni: string;
  distributorName: string;
  zoneName?: string;
};

type Line = {
  productId: number | null;
  distributorDni: string | null;
  quantity: number;
  filter?: string
};

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
    ChartComponent
  ],
  templateUrl: './sale.html',
  styleUrls: ['./sale.scss'],
})
export class SaleComponent implements OnInit {
  // --- InyecciÃ³n ---
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private saleSrv = inject(SaleService);
  private prodSrv = inject(ProductService);
  private cliSrv = inject(ClientService);
  private t = inject(TranslateService);
  private statsSrv = inject(StatsService);
  private authService = inject(AuthService);

  // --- Estado base ---
  sales = signal<SaleDTO[]>([]);
  products = signal<ProductDTO[]>([]);
  clients = signal<ClientDTO[]>([]);
  distributors = signal<DistributorDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // --- Usuario y roles ---
  currentUser = this.authService.user;
  isAdmin = computed(() => this.authService.hasRole(Role.ADMIN));
  isDistributor = computed(() => this.authService.hasRole(Role.DISTRIBUTOR));
  currentUserDni = computed(() => {
    const user = this.currentUser();
    const dni = (user as any)?.person?.dni;
    console.log('[SaleComponent] ðŸ” Current user DNI:', {
      hasUser: !!user,
      hasPerson: !!(user as any)?.person,
      dni: dni,
      username: user?.username,
      roles: user?.roles
    });
    return dni;
  });

  // --- Stats y Charts ---
  stats = signal<SalesStats | null>(null);
  loadingStats = signal(false);
  showStats = signal(false);
  
  salesChartData = signal<ChartConfiguration['data'] | null>(null);
  topProductsChartData = signal<ChartConfiguration['data'] | null>(null);
  distributorsChartData = signal<ChartConfiguration['data'] | null>(null);

  // --- Filtros de listado ---
  fTextInput = signal('');
  fTextApplied = signal('');
  fClientDniInput = signal('');
  fClientDniApplied = signal('');

  // --- Filtros de selects ---
  clientSearch = signal('');
  productSearch = signal('');
  selectedClientDni = signal<string | null>(null);
  selectedDistributorDni = signal<string | null>(null);

  // --- LÃ­neas de la venta en ediciÃ³n ---
  lines = signal<Line[]>([{ productId: null, distributorDni: null, quantity: 1, filter: '' }]);

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
    productId: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    quantity: this.fb.nonNullable.control(1, { validators: [Validators.min(1)] }),
  });

  // --- UI: abrir/cerrar secciones ---
  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }
  
  toggleStats() {
    const newValue = !this.showStats();
    console.log('ðŸ”„ Toggle stats:', { 
      before: this.showStats(), 
      after: newValue,
      hasStats: !!this.stats()
    });
    this.showStats.set(newValue);
    
    if (newValue && !this.stats()) {
      console.log('ðŸ“Š Loading stats for first time...');
      this.loadStats();
    }
  }

  // Expuesto al template
  get clientControl() { return this.form.controls.clientDni; }

  // âœ… NUEVO: Formatea fecha ISO a DD/MM/YYYY HH:mm
  formatDateTimeDDMMYYYY(isoDate: string | undefined): string {
    if (!isoDate) return 'â€”';
    
    try {
      const date = new Date(isoDate);
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year}, ${hours}:${minutes}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'â€”';
    }
  }
  
  // --- Ciclo de vida ---
  ngOnInit(): void {
    console.log('ðŸš€ Component initialized. showStats:', this.showStats());
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      prods: this.prodSrv.getAllProducts(),
      clis: this.cliSrv.getAllClients(),
      dists: this.http.get<any>('/api/distributors', { withCredentials: true }),
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
        
        console.log('ðŸ“¦ Products loaded:', productList.length, productList);
        console.log('ðŸ‘¥ Clients loaded:', clientList.length, clientList);
        console.log('ðŸšš Distributors loaded:', distributorList.length, distributorList);
        
        this.products.set(productList);
        this.clients.set(clientList);
        this.distributors.set(distributorList);
        
        this.loadSales();
      },
      error: (err) => { 
        console.error('âŒ Error loading catalog:', err);
        this.loadSales(); 
      }
    });
  }

  loadStats() {
    console.log('ðŸ“Š loadStats() called');
    this.loadingStats.set(true);
    
    const salesData = this.sales();
    
    if (!salesData || salesData.length === 0) {
      console.warn('âš ï¸ No sales data available');
      this.loadingStats.set(false);
      return;
    }

    const totalRevenue = salesData.reduce((sum, sale) => sum + this.calculateTotal(sale), 0);
    const totalSales = salesData.length;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    const salesByMonth = this.groupSalesByMonth(salesData);
    const topProducts = this.getTopProducts(salesData);
    const salesByDistributor = this.getSalesByDistributor(salesData);

    const stats: SalesStats = {
      totalSales,
      totalRevenue,
      averageTicket,
      salesByMonth,
      topProducts,
      salesByDistributor
    };

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

    console.log('âœ… Stats calculated:', stats);
    
    this.stats.set(stats);
    this.salesChartData.set(salesChartData);
    this.topProductsChartData.set(productsChartData);
    this.distributorsChartData.set(distributorsChartData);
    this.loadingStats.set(false);
  }

  private groupSalesByMonth(sales: SaleDTO[]): { month: string; amount: number }[] {
    const monthMap = new Map<string, number>();
    
    console.log('ðŸ“… Grouping sales by month...');
    
    sales.forEach(sale => {
      const date = new Date(sale.saleDate || sale.date || Date.now());
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      
      const saleTotal = this.calculateTotal(sale);
      const currentAmount = monthMap.get(monthKey) || 0;
      
      console.log(`  Sale #${sale.id}: ${monthKey} -> ${saleTotal} (accumulated: ${currentAmount + saleTotal})`);
      
      monthMap.set(monthKey, currentAmount + saleTotal);
    });

    console.log('ðŸ“… Month map final:', Array.from(monthMap.entries()));

    const result = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, amount]) => {
        const [year, monthNum] = key.split('-');
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return {
          month: `${monthNames[parseInt(monthNum)]} ${year}`,
          amount
        };
      });
    
    console.log('ðŸ“… Final result:', result);
    return result;
  }

  private getTopProducts(sales: SaleDTO[]): { productId: number; productName: string; quantity: number }[] {
    const productMap = new Map<number, { name: string; quantity: number }>();

    console.log('ðŸ“¦ Calculating top products from', sales.length, 'sales');

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

    console.log('ðŸ† Top products result:', result);
    return result;
  }

  private getSalesByDistributor(sales: SaleDTO[]): { distributorName: string; totalSales: number }[] {
    const distributorMap = new Map<string, number>();

    console.log('ðŸšš Calculating sales by distributor from', sales.length, 'sales');

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

    console.log('ðŸšš Distributors result:', result);
    return result;
  }

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

  filteredSales = computed(() => {
  const q = this.fTextApplied().toLowerCase().trim();
  const dni = this.fClientDniApplied().trim();
  
  return this.sales().filter(v => {
    // Si hay filtro de DNI, solo buscar por DNI
    if (dni) {
      const clientDni = v.client?.dni || '';
      return clientDni.includes(dni);
    }
    
    // Si hay filtro de texto general
    if (q) {
      // Primero intentar match exacto con ID
      const matchId = String(v.id) === q;
      if (matchId) return true;
      
      // Si no es un nÃºmero puro, buscar en otros campos
      const isNumericOnly = /^\d+$/.test(q);
      
      if (isNumericOnly) {
        // Si es solo nÃºmeros, buscar SOLO en ID
        return false;
      } else {
        // Si tiene letras, buscar en descripciÃ³n de productos, cliente y distribuidor
        const saleDescription = (v.details && v.details.length) 
          ? v.details.map(d => this.detailDescription(d)).join(' ').toLowerCase()
          : '';
        
        const clientName = v.client?.name?.toLowerCase() || '';
        const distributorName = v.distributor?.name?.toLowerCase() || '';
        
        return saleDescription.includes(q) || 
               clientName.includes(q) ||
               distributorName.includes(q);
      }
    }
    
    // Si no hay filtros, mostrar todas
    return true;
  });
});

  // Genera ofertas de productos (product x distributor combinations)
  productOffers = computed(() => {
    const offers: ProductOffer[] = [];
    const allProds = this.products();

    allProds.forEach(p => {
      if (p.distributors && p.distributors.length > 0) {
        p.distributors.forEach(d => {
          offers.push({
            productId: p.id,
            description: p.description,
            price: p.price,
            stock: p.stock,
            distributorDni: d.dni,
            distributorName: d.name,
            zoneName: d.zone?.name
          });
        });
      }
    });

    return offers;
  });

  filteredClients = computed(() => {
    const q = this.clientSearch().toLowerCase().trim();
    if (!q) return this.clients();
    return this.clients().filter(c =>
      (c.dni || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q)
    );
  });

  filteredProductOffers = computed(() => {
    const q = this.productSearch().toLowerCase().trim();
    const selectedDist = this.selectedDistributorDni();
    let offers = this.productOffers();

    // Filter by distributor if one is selected (from first product)
    if (selectedDist) {
      offers = offers.filter(o => o.distributorDni === selectedDist);
    }

    // Filter by search query
    if (!q) return offers;
    return offers.filter(o =>
      String(o.productId).includes(q) ||
      o.description.toLowerCase().includes(q) ||
      o.distributorName.toLowerCase().includes(q) ||
      (o.zoneName || '').toLowerCase().includes(q)
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

  loadSales() {
    this.saleSrv.getAllSales().subscribe({
      next: (list: SaleDTO[]) => {
        console.log('ðŸ“‹ Sales loaded from backend:', list.length, 'sales');

        if (list.length > 0) {
          console.log('ðŸ” First sale structure:', list[0]);
          console.log('ðŸ” Distributor in first sale:', list[0].distributor);
          console.log('ðŸ” Client in first sale:', list[0].client);
        }

        // Filtrar por distribuidor si no es admin
        let filteredSales = list;
        if (this.isDistributor() && !this.isAdmin()) {
          const userDni = this.currentUserDni();
          console.log('ðŸ” Filtering sales for distributor DNI:', userDni);

          if (userDni) {
            filteredSales = list.filter(sale => {
              const distributorDni = sale.distributor?.dni;
              const matches = distributorDni === userDni;
              if (!matches) {
                console.log('âŒ Filtered out sale:', sale.id, 'distributor:', distributorDni);
              }
              return matches;
            });
            console.log('âœ… Filtered sales for distributor:', filteredSales.length, 'of', list.length);
          } else {
            console.warn('âš ï¸ Distributor DNI not found, showing no sales');
            filteredSales = [];
          }
        } else if (this.isAdmin()) {
          console.log('ðŸ‘‘ Admin user - showing all sales');
        }

        this.sales.set(filteredSales);
        this.loading.set(false);

        if (filteredSales.length > 0) {
          console.log('ðŸ“Š Auto-loading stats because sales exist');
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
    return 'â€”';
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
  
  getDistributorById(id: string): DistributorDTO | undefined {
    return this.distributors().find(d => d.dni === id || (d as any).id === id);
  }

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
    const distributorDni = this.selectedDistributorDni() || '';

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

  new() {
    this.form.reset({
      id: null,
      clientDni: null,
      productId: null,
      quantity: 1
    });
    this.lines.set([{ productId: null, distributorDni: null, quantity: 1, filter: '' }]);
    this.submitted.set(false);
    this.error.set(null);
    this.clientSearch.set('');
    this.productSearch.set('');
    this.selectedClientDni.set(null);
    this.selectedDistributorDni.set(null);
    this.isNewOpen = false;
  }

  addLine() {
    const arr = [...this.lines()];
    arr.push({ productId: null, distributorDni: null, quantity: 1, filter: '' });
    this.lines.set(arr);
  }

  removeLine(idx: number) {
    const arr = [...this.lines()];
    arr.splice(idx, 1);
    if (arr.length === 0) {
      arr.push({ productId: null, distributorDni: null, quantity: 1, filter: '' });
    }

    // Reset distributor selection if no lines have products
    const hasProducts = arr.some(l => l.productId !== null);
    if (!hasProducts) {
      this.selectedDistributorDni.set(null);
    }

    this.lines.set(arr);
  }

  // Helper methods for template
  selectClient(client: ClientDTO): void {
    this.selectedClientDni.set(client.dni);
    this.form.patchValue({ clientDni: client.dni });
  }

  selectProductOffer(offer: ProductOffer, lineIndex: number): void {
    const arr = [...this.lines()];
    const line = arr[lineIndex];

    // If this is the first product selection, set the distributor
    if (!this.selectedDistributorDni()) {
      this.selectedDistributorDni.set(offer.distributorDni);
    }

    line.productId = offer.productId;
    line.distributorDni = offer.distributorDni;
    this.lines.set(arr);
  }

  trackByClientDni = (_: number, c: ClientDTO) => c.dni;
  trackByOfferId = (_: number, o: ProductOffer) => `${o.productId}-${o.distributorDni}`;

  save() {
    this.submitted.set(true);

    const clientDni = this.clientControl.value;
    if (!this.clientExists(clientDni)) {
      this.error.set(this.t.instant('sales.err.clientMissing'));
      this.clientControl.markAsTouched();
      return;
    }

    if (!this.selectedDistributorDni()) {
      this.error.set('Debe seleccionar al menos un producto');
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
        if (this.showStats() && this.stats()) {
          setTimeout(() => this.loadStats(), 500);
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

  getSalesChartOptions(): ChartConfiguration['options'] {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#f3f4f6',
          font: { size: 13, weight: 'bold' as any },
          padding: 16,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255, 215, 0, 0.7)',
        borderWidth: 3,
        padding: 18,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: 15,
          weight: 'bold' as any
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: (context) => {
            const value = context.parsed.y ?? 0;
            return `ðŸ’° Ventas: ${new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0
            }).format(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#d1d5db',
          font: { size: 11, weight: 600 }
        }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: {
          color: '#d1d5db',
          font: { size: 11, weight: 600 },
          callback: function(value) {
            return new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              notation: 'compact'
            }).format(value as number);
          }
        }
      }
    }
  };
}

/**
 * ðŸ© Opciones para grÃ¡fico de TOP PRODUCTOS
 * GrÃ¡fico de dona con colores diferentes
 */
getTopProductsChartOptions(): ChartConfiguration['options'] {
  const doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: '#f3f4f6',
          font: { size: 12, weight: 'bold' as any },
          padding: 14,
          usePointStyle: true,
          boxWidth: 15,
          boxHeight: 15,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels && data.datasets.length) {
              return (data.labels as string[]).map((label, i) => {
                const value = (data.datasets[0].data[i] as number) || 0;
                return {
                  text: `${label}: ${value}`,
                  fillStyle: (data.datasets[0].backgroundColor as string[])[i],
                  strokeStyle: (data.datasets[0].borderColor as string[])[i],
                  lineWidth: 2,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255, 215, 0, 0.7)',
        borderWidth: 3,
        padding: 18,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: 15,
          weight: 'bold' as any
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed ?? 0;
            const datasetValues = context.dataset.data as Array<number | null | undefined>;
            const total = datasetValues.reduce((acc: number, entry) => acc + (entry ?? 0), 0);
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `ðŸ“¦ ${label}: ${value} uds (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%', // Grosor de la dona
  };

  return doughnutOptions as ChartConfiguration['options'];
}

/**
 * ðŸ“Š Opciones para grÃ¡fico de DISTRIBUIDORES
 * GrÃ¡fico de barras horizontales con colores diferentes
 */
getDistributorsChartOptions(): ChartConfiguration['options'] {
  return {
    indexAxis: 'y' as const, // Barras horizontales
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        display: false // Ocultamos leyenda porque cada barra tiene su color
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255, 215, 0, 0.7)',
        borderWidth: 3,
        padding: 18,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: 15,
          weight: 'bold' as any
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: (context) => {
            const value = context.parsed.x ?? 0;
            return `ðŸšš Ventas: ${new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0
            }).format(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        ticks: {
          color: '#d1d5db',
          font: { size: 11, weight: 600 },
          callback: function(value) {
            return new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              notation: 'compact'
            }).format(value as number);
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#d1d5db',
          font: { size: 12, weight: 600 }
        }
      }
    }
  };
}
}

