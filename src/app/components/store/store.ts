// store.ts - Selección Inteligente Visual con Rotación por Zona (FIXED)

import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { ProductService } from '../../services/product/product';
import { ProductImageService } from '../../services/product-image/product-image';
import { AuthService } from '../../services/auth/auth';
import { SaleService } from '../../services/sale/sale';
import { DistributorService } from '../../services/distributor/distributor';
import { ApiResponse, ProductDTO } from '../../models/product/product.model';
import { DistributorDTO } from '../../models/distributor/distributor.model';
import { TranslateModule } from '@ngx-translate/core';
import { PurchaseSuccessModalComponent, PurchaseSuccessData } from '../../components/purchase-success-modal/purchase-success-modal';

type CartItem = {
  id: number;
  description: string | null;
  price: number;
  imageUrl?: string | null;
  qty: number;
};

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    FormsModule,
    TranslateModule,
    PurchaseSuccessModalComponent
  ],
  templateUrl: './store.html',
  styleUrls: ['./store.scss'],
})
export class StoreComponent implements OnInit {
  private productsSrv = inject(ProductService);
  private imgSvc = inject(ProductImageService, { optional: true as any });
  private authService = inject(AuthService);
  private saleService = inject(SaleService);
  private distributorService = inject(DistributorService);
  private router = inject(Router);

  private readonly PURCHASE_COUNT_KEY = 'distributor_purchase_rotation_v1';
  
  loading = signal(false);
  error = signal<string | null>(null);
  products = signal<ProductDTO[]>([]);

  searchInput = signal('');
  searchQuery = signal('');

  flashId = signal<number | null>(null);
  showCart = signal(false);
  toggleCartDrawer() { this.showCart.set(!this.showCart()); }

  showSuccessModal = signal(false);
  purchaseData = signal<PurchaseSuccessData | null>(null);
  processing = signal(false);

  distributors = signal<DistributorDTO[]>([]);
  
  // ✅ Cambio: Ahora puede ser un array de distribuidores
  selectedDistributors = signal<DistributorDTO[]>([]);
  
  loadingDistributors = signal(true);

  // ✅ Mapa: Producto → Distribuidores
  private productDistributorsMap = signal<Map<number, DistributorDTO[]>>(new Map());

  // ✅ IDs de productos que tienen al menos 1 distribuidor
  availableProductIds = computed(() => {
    const map = this.productDistributorsMap();
    const ids = new Set<number>();
    
    map.forEach((dists, productId) => {
      if (dists.length > 0) {
        ids.add(productId);
      }
    });
    
    return ids;
  });

  // ✅ Verificar si un producto está disponible
  isProductAvailable = (productId: number): boolean => {
    return this.availableProductIds().has(productId);
  };

  // ✅ Distribuidores que tienen TODOS los productos del carrito
  compatibleDistributors = computed(() => {
    const cartItems = this.itemsSig();
    if (cartItems.length === 0) return this.distributors();
    
    return this.findDistributorsWithAllProducts(cartItems.map(item => item.id));
  });

  // ✅ Auto-selección inteligente con prioridad de zona
  constructor() {
    effect(() => {
      const cartItems = this.itemsSig();
      const productIds = cartItems.map(i => i.id);
      
      console.log('🔄 EFFECT TRIGGERED - Cart changed');
      console.log('   📦 Cart items:', cartItems.length);
      console.log('   🆔 Product IDs:', productIds);
      
      const compatible = this.compatibleDistributors();
      console.log('   ✅ Compatible distributors:', compatible.length);
      compatible.forEach(d => {
        console.log(`      - ${d.name} (${d.dni}) - Zone: ${d.zone?.name}`);
      });
      
      if (compatible.length > 0) {
        // ✅ Hay UN distribuidor que tiene TODOS los productos
        const selected = this.selectBestDistributor(compatible);
        this.selectedDistributors.set([selected]);
        console.log('🎯 Single distributor selected:', selected.name, '(Zone:', selected.zone?.name, ')');
      } else {
        // ❌ NO hay un distribuidor con todos → Seleccionar MÚLTIPLES
        const multipleDistributors = this.selectMultipleDistributors();
        this.selectedDistributors.set(multipleDistributors);
        
        if (multipleDistributors.length === 0) {
          console.log('❌ No distributors available for any product');
        } else if (multipleDistributors.length === 1) {
          console.log('⚠️ Partial match, using:', multipleDistributors[0].name);
        } else {
          console.log('📍 Multiple distributors needed:');
          multipleDistributors.forEach(d => {
            console.log(`   - ${d.name} (${d.zone?.name})`);
          });
        }
      }
    }, { allowSignalWrites: true });
  }

  // ✅ Computed: Primer distribuidor (para compatibilidad con código existente)
  selectedDistributor = computed(() => {
    const distributors = this.selectedDistributors();
    return distributors.length > 0 ? distributors[0] : null;
  });

  // ✅ Computed: Verificar si hay múltiples distribuidores
  hasMultipleDistributors = computed(() => this.selectedDistributors().length > 1);

  // ✅ Computed: Mapear qué productos se retiran en cada distribuidor
  productsByDistributor = computed(() => {
    const distributors = this.selectedDistributors();
    const cartItems = this.itemsSig();
    const map = this.productDistributorsMap();
    
    const result = new Map<string, CartItem[]>();
    
    distributors.forEach(dist => {
      const productsForThisDist = cartItems.filter(item => {
        const productDists = map.get(item.id) || [];
        return productDists.some(pd => pd.dni === dist.dni);
      });
      
      result.set(dist.dni, productsForThisDist);
    });
    
    return result;
  });

  // ✅ Calcular subtotal de un distribuidor específico
  getDistributorSubtotal(dni: string): number {
    const products = this.productsByDistributor().get(dni) || [];
    return products.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  canPurchase = computed(() => this.authService.canPurchase());
  isEmailVerified = computed(() => this.authService.user()?.emailVerified ?? false);
  isVerified = computed(() => (this.authService.user() as any)?.isVerified ?? false);
  profileCompleteness = computed(() => this.authService.profileCompleteness());

  private LS_KEY = 'cart.v1';
  private itemsSig = signal<CartItem[]>(this.loadCart());
  private countSig = computed(() => this.itemsSig().reduce((a, it) => a + it.qty, 0));
  private totalSig = computed(() => this.itemsSig().reduce((a, it) => a + it.qty * (it.price ?? 0), 0));
  private bumpSig = signal(false);

  cart = {
    items: () => this.itemsSig(),
    count: () => this.countSig(),
    total: () => this.totalSig(),
  };
  bumpCart() { return this.bumpSig(); }

  list = computed(() => {
    const txt = this.searchQuery().toLowerCase().trim();
    return this.products().filter((p) =>
      !txt ||
      (p.description ?? '').toLowerCase().includes(txt) ||
      String(p.id).includes(txt)
    );
  });

  ngOnInit() { 
    this.refresh();
    this.loadDistributors();
  }

  refresh() {
    this.loading.set(true);
    this.error.set(null);
    this.productsSrv.getAllProducts().subscribe({
      next: (r: ApiResponse<ProductDTO[]> | ProductDTO[]) => {
        const data = Array.isArray(r) ? r : (r as any).data;
        const overlay = this.imgSvc?.overlay?.bind(this.imgSvc) ?? ((arr: ProductDTO[]) => arr);
        this.products.set(overlay(data ?? []));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'store.errors.load');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.searchQuery.set(this.searchInput());
  }

  onClearSearch(): void {
    this.searchInput.set('');
    this.searchQuery.set('');
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  // ✅ Cargar distribuidores y construir mapa
  private loadDistributors(): void {
    this.loadingDistributors.set(true);
    
    this.distributorService.getAll().subscribe({
      next: (distributors) => {
        console.log('📦 RAW RESPONSE from backend:', distributors);
        console.log('📦 Distributors loaded:', distributors.length);
        
        const map = new Map<number, DistributorDTO[]>();
        
        distributors.forEach((dist, idx) => {
          console.log(`\n  [${idx}] ${dist.name} (${dist.dni})`);
          console.log(`       RAW products from backend:`, dist.products);
          console.log(`       Type of products:`, typeof dist.products);
          console.log(`       Is array:`, Array.isArray(dist.products));
          
          const productIds = (dist.products || []).map(p => p.id);
          
          console.log(`       Zone: ${dist.zone?.name || 'Sin zona'}${dist.zone?.isHeadquarters ? ' ⭐' : ''}`);
          console.log(`       Product IDs extracted: [${productIds.join(', ') || 'none'}]`);
          
          // Mapear producto → distribuidores
          productIds.forEach(productId => {
            if (!map.has(productId)) {
              map.set(productId, []);
            }
            map.get(productId)!.push(dist);
          });
        });
        
        this.productDistributorsMap.set(map);
        this.distributors.set(distributors);
        this.loadingDistributors.set(false);
        
        console.log('🗺️ Product-Distributor map created');
        console.log('📊 Map contents:');
        map.forEach((dists, productId) => {
          console.log(`   Product ${productId}: ${dists.map(d => d.name).join(', ')}`);
        });
      },
      error: (err) => {
        console.error('❌ Error loading distributors:', err);
        this.loadingDistributors.set(false);
        this.error.set('Error al cargar distribuidores');
      }
    });
  }

  // ✅ ALGORITMO PRINCIPAL: Encontrar distribuidores con TODOS los productos
  private findDistributorsWithAllProducts(productIds: number[]): DistributorDTO[] {
    if (productIds.length === 0) return this.distributors();

    const map = this.productDistributorsMap();
    const allDists = this.distributors();
    
    console.log('🔍 Finding distributors with ALL products:', productIds);
    console.log('📊 Total distributors:', allDists.length);
    
    // Filtrar distribuidores que tienen TODOS los productos
    const result = allDists.filter(dist => {
      const distProductIds = (dist.products || []).map(p => p.id);
      console.log(`   🏢 Checking ${dist.name} (${dist.dni})`);
      console.log(`      Has products: [${distProductIds.join(', ')}]`);
      
      const hasAll = productIds.every(productId => {
        const productDists = map.get(productId) || [];
        const hasProduct = productDists.some(pd => pd.dni === dist.dni);
        
        if (!hasProduct) {
          console.log(`      ❌ Missing product ${productId}`);
        }
        
        return hasProduct;
      });
      
      if (hasAll) {
        console.log(`      ✅ ${dist.name} - tiene TODOS los productos`);
      } else {
        console.log(`      ❌ ${dist.name} - NO tiene todos`);
      }
      
      return hasAll;
    });
    
    console.log(`✅ Found ${result.length} distributors with all products`);
    return result;
  }

  // ✅ Seleccionar el MEJOR distribuidor (prioridad: zona común, headquarters, rotación)
  private selectBestDistributor(distributors: DistributorDTO[]): DistributorDTO {
    if (distributors.length === 0) {
      return this.distributors()[0]; // Fallback
    }
    
    if (distributors.length === 1) {
      return distributors[0];
    }

    console.log('🎯 Selecting best from', distributors.length, 'distributors');

    // 1️⃣ PRIORIDAD: Agrupar por zona
    const byZone = new Map<string, DistributorDTO[]>();
    distributors.forEach(d => {
      const zoneName = d.zone?.name || 'Sin Zona';
      if (!byZone.has(zoneName)) {
        byZone.set(zoneName, []);
      }
      byZone.get(zoneName)!.push(d);
    });

    console.log('📍 Distributors by zone:');
    byZone.forEach((dists, zone) => {
      console.log(`   ${zone}: ${dists.map(d => d.name).join(', ')}`);
    });

    // 2️⃣ Elegir la zona con MÁS distribuidores (más opciones)
    let bestZone = '';
    let maxCount = 0;
    byZone.forEach((dists, zone) => {
      if (dists.length > maxCount) {
        maxCount = dists.length;
        bestZone = zone;
      }
    });

    const candidatesInBestZone = byZone.get(bestZone) || [];
    console.log(`🏆 Best zone: "${bestZone}" with ${candidatesInBestZone.length} distributors`);

    // 3️⃣ Si solo hay 1 candidato en la mejor zona, retornarlo
    if (candidatesInBestZone.length === 1) {
      console.log(`✅ Only one distributor in zone: ${candidatesInBestZone[0].name}`);
      return candidatesInBestZone[0];
    }

    // 4️⃣ Rotación determinista basada en el contador de compras
    const purchaseCount = this.getPurchaseCount();
    
    // 🎲 Priorizar HQ en las primeras compras (compra 0, 3, 6, 9...)
    const hqInZone = candidatesInBestZone.find(d => d.zone?.isHeadquarters);
    if (hqInZone && purchaseCount % 3 === 0) {
      console.log(`⭐ Selected headquarters (priority rotation #${purchaseCount}):`, hqInZone.name);
      return hqInZone;
    }

    // 5️⃣ Rotación equitativa entre TODOS los distribuidores de la zona
    const index = purchaseCount % candidatesInBestZone.length;
    const selected = candidatesInBestZone[index];
    
    console.log(`🔄 Rotation: purchase #${purchaseCount}, index ${index}/${candidatesInBestZone.length} → ${selected.name}`);
    return selected;
  }

  // ✅ Seleccionar MÚLTIPLES distribuidores cuando no hay uno con todos los productos
  private selectMultipleDistributors(): DistributorDTO[] {
    const cartItems = this.itemsSig();
    if (cartItems.length === 0) return [];

    const map = this.productDistributorsMap();
    const allDists = this.distributors();

    console.log('📍 MULTIPLE DISTRIBUTORS MODE: Finding best combination');
    console.log(`   Cart has ${cartItems.length} items:`, cartItems.map(i => `${i.id} (${i.description})`));

    // Crear un mapa: productId → mejor distribuidor para ese producto
    const productToDistributor = new Map<number, DistributorDTO>();
    const distributorsUsed = new Set<string>(); // DNIs de distribuidores ya usados
    
    // Para cada producto del carrito, encontrar el mejor distribuidor
    cartItems.forEach(item => {
      const productDists = map.get(item.id) || [];
      
      if (productDists.length === 0) {
        console.log(`   ❌ Product ${item.id} (${item.description}): NO distributors available`);
        return;
      }

      // Priorizar distribuidores que ya estamos usando (para minimizar zonas)
      let bestDist = productDists.find(d => distributorsUsed.has(d.dni));
      
      if (!bestDist) {
        // Si no hay overlap, elegir el primero (o aplicar lógica de prioridad)
        // Priorizar HQ si existe
        bestDist = productDists.find(d => d.zone?.isHeadquarters) || productDists[0];
      }

      console.log(`   ✅ Product ${item.id} (${item.description}): ${bestDist.name} (${bestDist.zone?.name})`);
      
      productToDistributor.set(item.id, bestDist);
      distributorsUsed.add(bestDist.dni);
    });

    // Obtener lista única de distribuidores
    const uniqueDistributors = Array.from(new Set(
      Array.from(productToDistributor.values()).map(d => d.dni)
    )).map(dni => allDists.find(d => d.dni === dni)!).filter(Boolean);

    console.log(`📊 Result: ${uniqueDistributors.length} distributor(s) needed`);
    uniqueDistributors.forEach(d => {
      const productsFromThis = cartItems.filter(item => 
        productToDistributor.get(item.id)?.dni === d.dni
      );
      console.log(`   🏢 ${d.name} (${d.zone?.name}): ${productsFromThis.length} products`);
      console.log(`      Products: ${productsFromThis.map(p => p.description).join(', ')}`);
    });

    return uniqueDistributors;
  }

  // ✅ Fallback: Si ningún distribuidor tiene TODOS los productos
  private selectFallbackDistributor(): DistributorDTO | null {
    const cartItems = this.itemsSig();
    if (cartItems.length === 0) return null;

    const map = this.productDistributorsMap();
    const allDists = this.distributors();

    console.log('⚠️ FALLBACK MODE: No distributor has ALL products');
    console.log(`   Cart has ${cartItems.length} items:`, cartItems.map(i => i.id));

    // Contar cuántos productos tiene cada distribuidor
    const scores = allDists.map(dist => {
      const matchingProducts = cartItems.filter(item => {
        const productDists = map.get(item.id) || [];
        const hasProduct = productDists.some(pd => pd.dni === dist.dni);
        return hasProduct;
      });
      
      const count = matchingProducts.length;
      
      console.log(`   ${dist.name}: ${count}/${cartItems.length} products`);
      if (count > 0) {
        console.log(`      Has: ${matchingProducts.map(p => p.id).join(', ')}`);
      }
      
      return { dist, count };
    });

    // Ordenar por mayor cantidad de productos
    scores.sort((a, b) => b.count - a.count);

    // ✅ FILTRAR: Solo distribuidores que tienen AL MENOS 1 producto
    const validScores = scores.filter(s => s.count > 0);
    
    if (validScores.length === 0) {
      console.log('❌ NO DISTRIBUTOR has ANY product from the cart!');
      return null;  // ✅ Retornar null si ninguno tiene productos
    }

    const best = validScores[0];
    console.log(`✅ Fallback selected: ${best.dist.name} (has ${best.count}/${cartItems.length} products)`);
    
    return best.dist;
  }

  // ✅ Contador de rotación
  private getPurchaseCount(): number {
    try {
      const count = localStorage.getItem(this.PURCHASE_COUNT_KEY);
      return count ? parseInt(count, 10) : 0;
    } catch {
      return 0;
    }
  }

  private incrementPurchaseCount(): void {
    try {
      const count = this.getPurchaseCount();
      localStorage.setItem(this.PURCHASE_COUNT_KEY, String(count + 1));
      console.log(`📊 Purchase counter incremented: ${count} → ${count + 1}`);
    } catch {}
  }

  // ✅ Funciones de carrito (sin restricciones)
  add(p: ProductDTO) {
    const items = [...this.itemsSig()];
    const idx = items.findIndex((it) => it.id === p.id);

    if (idx >= 0) {
      items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
      this.itemsSig.set(this.moveToFront(items, p.id as number));
    } else {
      items.unshift({
        id: p.id as number,
        description: p.description ?? null,
        price: p.price ?? 0,
        imageUrl: p.imageUrl ?? null,
        qty: 1,
      });
      this.itemsSig.set(items);
    }
    this.persistCart();
    this.scrollCartTopSoon();
    this.pulseCart();
  }

  private persistCart() {
    try { localStorage.setItem(this.LS_KEY, JSON.stringify(this.itemsSig())); } catch {}
  }
  
  private loadCart(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(this.LS_KEY) || '[]') as CartItem[]; }
    catch { return []; }
  }

  private moveToFront(items: CartItem[], id: number): CartItem[] {
    const idx = items.findIndex(i => i.id === id);
    if (idx <= 0) return items;
    const [it] = items.splice(idx, 1);
    items.unshift(it);
    return items;
  }

  private scrollCartTopSoon() {
    if (!this.showCart()) return;
    setTimeout(() => {
      const el = document.querySelector('.cart-drawer__list') as HTMLElement | null;
      el?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  inc(id: number) {
    let items = this.itemsSig().map((it) => it.id === id ? { ...it, qty: it.qty + 1 } : it);
    items = this.moveToFront(items, id);
    this.itemsSig.set(items);
    this.persistCart();
    this.pulseCart();
    this.scrollCartTopSoon();
  }

  dec(id: number) {
    let items = this.itemsSig().map((it) => it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it);
    items = items.filter((it) => it.qty > 0);
    this.itemsSig.set(items);
    this.persistCart();
    this.pulseCart();
  }

  remove(id: number) {
    const items = this.itemsSig().filter((it) => it.id !== id);
    this.itemsSig.set(items);
    this.persistCart();
    this.pulseCart();
  }

  clear() {
    this.itemsSig.set([]);
    this.persistCart();
    this.pulseCart();
  }

  // ✅ Checkout con selección inteligente (soporta múltiples distribuidores)
  goToCheckout() {
    console.group('🛒 CHECKOUT');
    console.log('Cart items:', this.cart.items());
    console.log('Selected distributors:', this.selectedDistributors());
    console.log('Has multiple:', this.hasMultipleDistributors());
    console.groupEnd();

    if (!this.canPurchase() || this.cart.count() === 0) {
      return;
    }

    const selectedDists = this.selectedDistributors();
    
    if (selectedDists.length === 0) {
      this.error.set('⚠️ No hay distribuidores disponibles en este momento.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const user = this.authService.user();
    const clientDni = (user as any)?.person?.dni;

    if (!clientDni) {
      this.error.set('Tu perfil no tiene DNI. Completa tus datos en "Mi Cuenta".');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    // ✅ Si hay múltiples distribuidores, crear múltiples ventas
    if (this.hasMultipleDistributors()) {
      this.createMultipleSales(clientDni, selectedDists);
    } else {
      // ✅ Compra simple (un solo distribuidor)
      this.createSingleSale(clientDni, selectedDists[0]);
    }
  }

  // ✅ Crear múltiples ventas (una por distribuidor)
  private createMultipleSales(clientDni: string, distributors: DistributorDTO[]) {
    console.log('📦 Creating multiple sales for', distributors.length, 'distributors');
    
    const productsByDist = this.productsByDistributor();
    const requests: Observable<any>[] = [];
    
    distributors.forEach(dist => {
      const products = productsByDist.get(dist.dni) || [];
      
      if (products.length === 0) return;
      
      const payload = {
        clientDni: clientDni,
        distributorDni: dist.dni,
        details: products.map(item => ({
          productId: item.id,
          quantity: item.qty
        }))
      };
      
      console.log(`  📦 Sale for ${dist.name}:`, payload);
      requests.push(this.saleService.createSale(payload));
    });

    // Ejecutar todas las ventas en paralelo
    forkJoin(requests).subscribe({
      next: (responses) => {
        console.log('✅ All sales created:', responses);
        
        this.processing.set(false);
        this.authService.forceRefresh();
        this.incrementPurchaseCount();
        
        // Preparar datos para modal de éxito (mostrar resumen de todas las ventas)
        const totalAmount = this.cart.total();
        const allSales = responses.map(r => r.data);
        
        this.purchaseData.set({
          saleId: allSales.length, // Cantidad de ventas
          total: totalAmount,
          distributor: {
            dni: 'multiple',
            name: `${distributors.length} ubicaciones`,
            phone: null,
            email: '',
            address: null,
            zone: null
          },
          multipleSales: allSales.map((sale, index) => ({
            saleId: sale.id,
            distributor: distributors[index],
            products: productsByDist.get(distributors[index].dni) || [],
            subtotal: this.getDistributorSubtotal(distributors[index].dni)
          }))
        });
        
        console.log('✅ Multiple purchase data:', this.purchaseData());
        
        this.showSuccessModal.set(true);
        this.clear();
        
        if (this.showCart()) {
          this.toggleCartDrawer();
        }
      },
      error: (err) => {
        console.error('❌ Purchase error:', err);
        this.processing.set(false);
        this.error.set(err.error?.message || 'Error al procesar las compras');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ✅ Crear venta simple (un solo distribuidor)
  private createSingleSale(clientDni: string, distributor: DistributorDTO) {
    const payload = {
      clientDni: clientDni,
      distributorDni: distributor.dni,
      details: this.cart.items().map(item => ({
        productId: item.id,
        quantity: item.qty
      }))
    };

    console.log('🛒 Creating single sale with distributor:', {
      distributor: distributor.name,
      zone: distributor.zone?.name,
      payload
    });

    this.saleService.createSale(payload).subscribe({
      next: (response) => {
        console.log('✅ Sale created:', response);
        
        this.processing.set(false);
        this.authService.forceRefresh();
        this.incrementPurchaseCount();
        
        const saleData = response.data;
        
        this.purchaseData.set({
          saleId: saleData?.id || 0,
          total: this.cart.total(),
          distributor: {
            dni: distributor.dni,
            name: distributor.name,
            phone: distributor.phone ?? null,
            email: distributor.email,
            address: distributor.address ?? null,
            zone: distributor.zone ? {
              id: distributor.zone.id,
              name: distributor.zone.name,
              isHeadquarters: distributor.zone.isHeadquarters ?? false
            } : null
          }
        });
        
        console.log('✅ Purchase data for modal:', this.purchaseData());
        
        this.showSuccessModal.set(true);
        this.clear();
        
        if (this.showCart()) {
          this.toggleCartDrawer();
        }
      },
      error: (err) => {
        console.error('❌ Purchase error:', err);
        this.processing.set(false);
        this.error.set(err.error?.message || 'Error al procesar la compra');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  onCloseSuccessModal(): void {
    this.showSuccessModal.set(false);
    this.purchaseData.set(null);
  }

  onAddClick(ev: MouseEvent, p: ProductDTO) {
    this.add(p);
    const btn = ev.currentTarget as HTMLElement | null;
    const card = btn?.closest('.store-card') as HTMLElement | null;
    if (card) {
      this.flashId.set(p.id as number);
      setTimeout(() => this.flashId.set(null), 250);
    }
    const fab = document.getElementById('cartAnchor');
    if (!fab) { this.pulseCart(); return; }
    const imgFound = card?.querySelector('.store-card__media img') as HTMLImageElement | null;
    const sourceEl: HTMLElement = imgFound ?? btn!;
    this.flyToCart(sourceEl, fab, Boolean(imgFound));
  }

  private flyToCart(fromEl: HTMLElement, toEl: HTMLElement, isImage: boolean) {
    const start = fromEl.getBoundingClientRect();
    const end = toEl.getBoundingClientRect();

    const startX = start.left + start.width / 2;
    const startY = start.top + start.height / 2;
    const endX = end.left + end.width / 2;
    const endY = end.top + end.height / 2;

    let node: HTMLElement;
    if (isImage && fromEl instanceof HTMLImageElement) {
      const img = fromEl.cloneNode(true) as HTMLImageElement;
      const size = Math.max(44, Math.min(Math.min(start.width, start.height), 120));
      Object.assign(img.style, {
        position: 'fixed', left: '0', top: '0',
        width: `${size}px`, height: `${size}px`,
        objectFit: 'cover', borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 10px 26px rgba(0,0,0,.35), 0 6px 16px rgba(255,255,255,.12) inset',
        transform: `translate(${startX}px, ${startY}px) translate(-50%, -50%)`,
        zIndex: '9999',
      } as CSSStyleDeclaration);
      img.className = 'fly-clone';
      node = img;
    } else {
      const bubble = document.createElement('div');
      Object.assign(bubble.style, {
        position: 'fixed', left: '0', top: '0',
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
        boxShadow: '0 8px 22px rgba(255,255,255,.18), 0 10px 30px rgba(0,0,0,.25)',
        transform: `translate(${startX}px, ${startY}px) translate(-50%, -50%)`,
        zIndex: '9999',
      } as CSSStyleDeclaration);
      bubble.className = 'fly-bubble';
      node = bubble;
    }
    document.body.appendChild(node);

    const dx = endX - startX;
    const midX = startX + dx * 0.5;
    const midY = Math.min(startY, endY) - Math.max(60, Math.abs(dx) * 0.12);

    const keyframes: Keyframe[] = [
      { transform: `translate(${startX}px, ${startY}px) translate(-50%, -50%) scale(1)`, opacity: 1, offset: 0 },
      { transform: `translate(${midX}px, ${midY}px) translate(-50%, -50%) scale(0.6)`, opacity: 0.9, offset: 0.6 },
      { transform: `translate(${endX}px, ${endY}px) translate(-50%, -50%) scale(0.2)`, opacity: 0.35, offset: 1 },
    ];

    const anim = (node as any).animate(keyframes, {
      duration: 800,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'forwards',
    });

    anim.onfinish = () => { node.remove(); this.pulseCart(); };
    anim.oncancel = () => { node.remove(); };
  }

  private pulseCart(): void {
    this.bumpSig.set(false);
    void document.body.offsetWidth;
    this.bumpSig.set(true);
    setTimeout(() => this.bumpSig.set(false), 350);
  }
}