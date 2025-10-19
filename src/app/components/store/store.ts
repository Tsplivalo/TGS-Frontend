// store.ts - Con selector de distribuidor

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product/product';
import { ProductImageService } from '../../services/product-image/product-image';
import { AuthService } from '../../services/auth/auth';
import { SaleService } from '../../services/sale/sale';
import { DistributorService } from '../../services/distributor/distributor';
import { ApiResponse, ProductDTO } from '../../models/product/product.model';
import { DistributorDTO } from '../../models/distributor/distributor.model'; // ✅ IMPORTAR del modelo
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
    FormsModule, // ✅ IMPORTANTE: Agregar para ngModel
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

  // ✅ NUEVO: Lista de distribuidores y selección
  distributors = signal<DistributorDTO[]>([]);
  selectedDistributorDni = signal<string | null>(null);
  loadingDistributors = signal(true);

  // ✅ Computed: Distribuidor seleccionado completo
  selectedDistributor = computed(() => {
    const dni = this.selectedDistributorDni();
    if (!dni) return null;
    return this.distributors().find(d => d.dni === dni) || null;
  });

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

  // ✅ MEJORADO: Cargar distribuidores con información completa
  private loadDistributors(): void {
    this.loadingDistributors.set(true);
    
    this.distributorService.getAll().subscribe({
      next: (distributors) => {
        console.log('📦 Distributors loaded:', distributors);
        console.log('📊 Number of distributors:', distributors.length);
        
        // Log cada distribuidor
        distributors.forEach((d, idx) => {
          console.log(`  [${idx}] ${d.name} (DNI: ${d.dni}) - Zone: ${d.zone?.name || 'No zone'}${d.zone?.isHeadquarters ? ' ⭐' : ''}`);
        });
        
        this.distributors.set(distributors);
        this.loadingDistributors.set(false);
        
        if (distributors.length > 0) {
          // Prioridad 1: Sede central (headquarters)
          const headquarters = distributors.find(d => d.zone?.isHeadquarters);
          
          if (headquarters) {
            this.selectedDistributorDni.set(headquarters.dni);
            console.log('✅ Auto-selected headquarters:', headquarters.name, 'DNI:', headquarters.dni);
          } else {
            // Prioridad 2: Primer distribuidor
            this.selectedDistributorDni.set(distributors[0].dni);
            console.log('✅ Auto-selected first distributor:', distributors[0].name, 'DNI:', distributors[0].dni);
          }
          
          console.log('🎯 Selected DNI after load:', this.selectedDistributorDni());
          console.log('🎯 Selected Distributor object:', this.selectedDistributor());
        } else {
          console.error('❌ No distributors available');
          this.error.set('No hay distribuidores disponibles. Contacta al soporte.');
        }
      },
      error: (err) => {
        console.error('❌ Error loading distributors:', err);
        this.loadingDistributors.set(false);
        this.error.set('Error al cargar distribuidores');
      }
    });
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

  // ✅ MEJORADO: Validar distribuidor seleccionado
  goToCheckout() {
    console.group('🛒 CHECKOUT DEBUG');
    console.log('Can purchase:', this.canPurchase());
    console.log('Cart count:', this.cart.count());
    console.log('All distributors:', this.distributors());
    console.log('Selected DNI:', this.selectedDistributorDni());
    console.log('Selected Distributor object:', this.selectedDistributor());
    console.groupEnd();

    if (!this.canPurchase() || this.cart.count() === 0) {
      return;
    }

    const distributorDni = this.selectedDistributorDni();
    if (!distributorDni) {
      this.error.set('⚠️ Debes seleccionar un distribuidor antes de comprar.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const user = this.authService.user();
    const clientDni = (user as any)?.person?.dni;

    if (!clientDni) {
      this.error.set('ERROR: Tu perfil no tiene DNI. Ve a "Mi Cuenta" y completa tus datos personales.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.processing.set(true);
    this.error.set(null);

    const payload = {
      clientDni: clientDni,
      distributorDni: distributorDni,
      details: this.cart.items().map(item => ({
        productId: item.id,
        quantity: item.qty
      }))
    };

    console.log('🛒 Creating purchase with distributor:', {
      distributor: this.selectedDistributor(),
      payload
    });

    this.saleService.createSale(payload).subscribe({
      next: (response) => {
        console.log('✅ Sale created:', response);
        
        this.processing.set(false);
        this.authService.forceRefresh();
        
        const saleData = response.data;
        
        // ✅ Usar el distribuidor seleccionado localmente
        const selectedDist = this.selectedDistributor();
        
        console.log('📋 Purchase data to show in modal:', {
          selectedDist,
          saleId: saleData?.id,
          total: this.cart.total()
        });
        
        this.purchaseData.set({
          saleId: saleData?.id || 0,
          total: this.cart.total(),
          distributor: selectedDist ? {
            dni: selectedDist.dni,
            name: selectedDist.name,
            phone: selectedDist.phone ?? null,
            email: selectedDist.email,
            address: selectedDist.address ?? null,
            zone: selectedDist.zone ? {
              id: selectedDist.zone.id,
              name: selectedDist.zone.name,
              isHeadquarters: selectedDist.zone.isHeadquarters ?? false
            } : null
          } : null
        });
        
        console.log('✅ Purchase data set:', this.purchaseData());
        
        this.showSuccessModal.set(true);
        this.clear();
        
        if (this.showCart()) {
          this.toggleCartDrawer();
        }
      },
      error: (err) => {
        console.error('❌ Purchase error:', err);
        this.processing.set(false);
        let errorMessage = err.error?.message || 'Error al procesar la compra';
        this.error.set(errorMessage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  onCloseSuccessModal(): void {
    this.showSuccessModal.set(false);
    this.purchaseData.set(null);
  }

  onAddClick(ev: MouseEvent, p: ProductDTO, imgEl?: HTMLImageElement) {
    this.add(p);
    const btn = ev.currentTarget as HTMLElement | null;
    const card = btn?.closest('.store-card') as HTMLElement | null;
    if (card) {
      this.flashId.set(p.id as number);
      setTimeout(() => this.flashId.set(null), 250);
    }
    const fab = document.getElementById('cartAnchor');
    if (!fab) { this.pulseCart(); return; }
    const imgFound = imgEl ?? (card?.querySelector('.store-card__media img') as HTMLImageElement | null);
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