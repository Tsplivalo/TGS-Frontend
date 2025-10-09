import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product/product';
import { ProductImageService } from '../../services/product-image/product-image';
import { ApiResponse, ProductDTO } from '../../models/product/product.model';

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
  imports: [CommonModule],
  templateUrl: './store.html',
  styleUrls: ['./store.scss'],
})
export class StoreComponent implements OnInit {
  private productsSrv = inject(ProductService);
  private imgSvc = inject(ProductImageService, { optional: true as any });

  // estado
  loading = signal(false);
  error   = signal<string | null>(null);

  // datos
  products = signal<ProductDTO[]>([]);

  // búsqueda
  q = signal('');

  // flash card
  flashId = signal<number | null>(null);

  // drawer carrito
  showCart = signal(false);
  toggleCartDrawer() { this.showCart.set(!this.showCart()); }

  // carrito (localStorage)
  private LS_KEY = 'cart.v1';
  private itemsSig = signal<CartItem[]>(this.loadCart());

  // totales + bump
  private countSig = computed(() => this.itemsSig().reduce((a, it) => a + it.qty, 0));
  private totalSig = computed(() => this.itemsSig().reduce((a, it) => a + it.qty * (it.price ?? 0), 0));
  private bumpSig  = signal(false);

  cart = {
    items: () => this.itemsSig(),
    count: () => this.countSig(),
    total: () => this.totalSig(),
  };
  bumpCart() { return this.bumpSig(); }

  // lista filtrada
  list = computed(() => {
    const txt = this.q().toLowerCase().trim();
    return this.products().filter((p) =>
      !txt ||
      (p.description ?? '').toLowerCase().includes(txt) ||
      String(p.id).includes(txt)
    );
  });

  ngOnInit() { this.refresh(); }

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
        this.error.set(err?.error?.message ?? 'No se pudo cargar la tienda');
        this.loading.set(false);
      },
    });
  }

  // ===== helpers carrito =====
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

  // ===== Carrito =====
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
    items = this.moveToFront(items, id);       // << también sube al tope al incrementar
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

  // ===== Agregar + flash + vuelo (imagen redonda) =====
  onAddClick(ev: MouseEvent, p: ProductDTO, imgEl?: HTMLImageElement) {
    // 1) agrega y arriba
    this.add(p);

    // 2) flash
    const btn  = ev.currentTarget as HTMLElement | null;
    const card = btn?.closest('.store-card') as HTMLElement | null;
    if (card) {
      this.flashId.set(p.id as number);
      setTimeout(() => this.flashId.set(null), 250);
    }

    // 3) vuelo hacia el FAB
    const fab = document.getElementById('cartAnchor');
    if (!fab) { this.pulseCart(); return; }

    // si no vino imgEl, buscamos dentro de la card
    const imgFound = imgEl ?? (card?.querySelector('.store-card__media img') as HTMLImageElement | null);
    const sourceEl: HTMLElement = imgFound ?? btn!;
    this.flyToCart(sourceEl, fab, Boolean(imgFound));
  }

  private flyToCart(fromEl: HTMLElement, toEl: HTMLElement, isImage: boolean) {
    const start = fromEl.getBoundingClientRect();
    const end   = toEl.getBoundingClientRect();

    const startX = start.left + start.width  / 2;
    const startY = start.top  + start.height / 2;
    const endX   = end.left   + end.width    / 2;
    const endY   = end.top    + end.height   / 2;

    // Nodo volador: ahora REDONDO si hay imagen
    let node: HTMLElement;
    if (isImage && fromEl instanceof HTMLImageElement) {
      const img = fromEl.cloneNode(true) as HTMLImageElement;
      const size = Math.max(44, Math.min(Math.min(start.width, start.height), 120)); // 44–120px
      Object.assign(img.style, {
        position: 'fixed',
        left: '0', top: '0',
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'cover',
        borderRadius: '50%',              // << redondo
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
        position: 'fixed',
        left: '0', top: '0',
        width: '18px', height: '18px',
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 8px 22px rgba(255,255,255,.18), 0 10px 30px rgba(0,0,0,.25)',
        transform: `translate(${startX}px, ${startY}px) translate(-50%, -50%)`,
        zIndex: '9999',
      } as CSSStyleDeclaration);
      bubble.className = 'fly-bubble';
      node = bubble;
    }
    document.body.appendChild(node);

    // Arco suave
    const dx = endX - startX;
    const midX = startX + dx * 0.5;
    const midY = Math.min(startY, endY) - Math.max(60, Math.abs(dx) * 0.12);

    const keyframes: Keyframe[] = [
      { transform: `translate(${startX}px, ${startY}px) translate(-50%, -50%) scale(1)`,   opacity: 1,   offset: 0   },
      { transform: `translate(${midX}px,   ${midY}px)   translate(-50%, -50%) scale(0.6)`, opacity: 0.9, offset: 0.6 },
      { transform: `translate(${endX}px,   ${endY}px)   translate(-50%, -50%) scale(0.2)`, opacity: 0.35,offset: 1   },
    ];

    const anim = (node as any).animate(keyframes, {
      duration: 800,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'forwards',
    });

    anim.onfinish = () => { node.remove(); this.pulseCart(); };
    anim.oncancel = () => { node.remove(); };
  }

  // feedback FAB
  private pulseCart(): void {
    this.bumpSig.set(false);
    void document.body.offsetWidth; // reflow
    this.bumpSig.set(true);
    setTimeout(() => this.bumpSig.set(false), 350);
  }
}
