import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, Validators, FormGroup, FormControl
} from '@angular/forms';

import { VentaService } from '../../services/venta/venta';
import { ProductoService } from '../../services/producto/producto';
import { ClienteService } from '../../services/cliente/cliente';

import {
  VentaDTO, CreateVentaDTO, UpdateVentaDTO, ApiResponse as ApiVentaResp, VentaDetalleDTO, VentaClienteDTO
} from '../../models/venta/venta.model';
import { ProductoDTO, ApiResponse as ApiProdResp } from '../../models/producto/producto.model';
import { ClienteDTO, ApiResponse as ApiCliResp } from '../../models/cliente/cliente.model';

import { forkJoin } from 'rxjs';

type VentaForm = {
  id: FormControl<number | null>;
  clienteDni: FormControl<string | null>;
  // edición simple (una línea)
  productoId: FormControl<number | null>;
  cantidad: FormControl<number>;
};

type Linea = { productoId: number | null; cantidad: number; filtro?: string };

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './venta.html',
  styleUrls: ['./venta.scss'],
})
export class VentaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ventaSrv = inject(VentaService);
  private prodSrv = inject(ProductoService);
  private cliSrv = inject(ClienteService);

  ventas = signal<VentaDTO[]>([]);
  productos = signal<ProductoDTO[]>([]);
  clientes = signal<ClienteDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // filtros lista
  fTexto = '';
  fClienteDni = '';

  // filtros de selects
  filtroProducto = '';
  filtroCliente = '';

  // líneas para crear
  lineas = signal<Linea[]>([{ productoId: null, cantidad: 1, filtro: '' }]);

  // form reactivo
  form: FormGroup<VentaForm> = this.fb.group<VentaForm>({
    id: this.fb.control<number | null>(null),
    clienteDni: this.fb.control<string | null>(null, { validators: [Validators.required, Validators.minLength(6)] }),
    productoId: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    cantidad: this.fb.nonNullable.control(1, { validators: [Validators.min(1)] }),
  });
  
  nuevoAbierto = false;
  toggleNuevo(){ this.nuevoAbierto = !this.nuevoAbierto; }


  // ==== getters para template ====
  get isEditing(): boolean { return !!this.form.controls.id.value; }
  get idValue(): number | null { return this.form.controls.id.value ?? null; }
  get clienteControl() { return this.form.controls.clienteDni; }
  get productoControl() { return this.form.controls.productoId; }
  get cantidadControl() { return this.form.controls.cantidad; }

  ngOnInit(): void {
    // Cargar catálogo primero (productos + clientes) y recién después ventas
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      prods: this.prodSrv.getAllProductos(),
      clis: this.cliSrv.getAllClientes(),
    }).subscribe({
      next: (res: { prods: ApiProdResp<ProductoDTO[]> | any; clis: ApiCliResp<ClienteDTO[]> | any }) => {
        const listaProd = (res.prods?.data ?? res.prods?.productos ?? []) as ProductoDTO[];
        const listaCli  = (res.clis?.data  ?? res.clis?.clientes  ?? []) as ClienteDTO[];
        this.productos.set(listaProd);
        this.clientes.set(listaCli);
        // ahora sí, ventas (ya tenemos catálogo para mostrar nombres de ítems)
        this.cargarVentas();
      },
      error: (err) => {
        console.warn('[VENTA] Error cargando catálogos:', err);
        // Incluso si falla uno, intento cargar ventas para no dejar la pantalla en blanco
        this.cargarVentas();
      }
    });
  }


  getStock(id: number | null | undefined): number {
  if (id == null) return 0;
  const p = this.productos().find(x => x.id === id);
  const raw = p?.stock;
  const n = typeof raw === 'string' ? Number(raw) : (typeof raw === 'number' ? raw : 0);
  return Number.isFinite(n) ? n : 0;
  }


  clampCantidad(idx: number) {
  const arr = [...this.lineas()];
  const l = arr[idx];
  const max = this.getStock(l.productoId);
  let val = Number(l.cantidad) || 1;
  if (val < 1) val = 1;
  if (max > 0 && val > max) val = max;
  l.cantidad = val;
  this.lineas.set(arr);
  }


  // ===== filtros =====
  ventasFiltradas = computed(() => {
    const q = (this.fTexto || '').toLowerCase().trim();
    const dni = (this.fClienteDni || '').trim();
    return this.ventas().filter(v => {
      const descVenta = (v.producto && v.producto.descripcion) ? v.producto.descripcion.toLowerCase() : '';
      let hayTexto = (!q) || descVenta.includes(q) || String(v.id).includes(q);
      if (!hayTexto && v.detalles && v.detalles.length) {
        for (const d of v.detalles) {
          const dd = this.descDetalle(d).toLowerCase();
          if (dd.includes(q)) { hayTexto = true; break; }
        }
      }
      const matchDni = !dni || (v.cliente && v.cliente.dni ? v.cliente.dni.includes(dni) : false);
      return (q ? hayTexto : true) && matchDni;
    });
  });

  productosFiltradosPor = (filtro: string) => {
    const q = (filtro || '').toLowerCase().trim();
    if (!q) return this.productos();
    return this.productos().filter(p =>
      String(p.id).includes(q) || ((p.descripcion || '').toLowerCase().includes(q))
    );
  };

  clientesFiltrados = computed(() => {
    const q = (this.filtroCliente || '').toLowerCase().trim();
    if (!q) return this.clientes();
    return this.clientes().filter(c =>
      (c.dni || '').toLowerCase().includes(q) ||
      (c.nombre || '').toLowerCase().includes(q)
    );
  });

  // ===== cargas =====
  cargarVentas() {
    this.ventaSrv.getAllVentas().subscribe({
      next: (res: ApiVentaResp<VentaDTO[]> | any) => {
        const lista = (res?.data ?? res?.ventas ?? []) as VentaDTO[];
        this.ventas.set(lista);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudieron cargar las ventas.');
        this.loading.set(false);
      }
    });
  }

  sumarCantidades(v: VentaDTO): number {
    const det = this.getDetalles(v) ?? [];
    let total = 0;
    for (let i = 0; i < det.length; i++) {
      const cant = Number((det[i] as any)?.cantidad);
      if (Number.isFinite(cant)) total += cant;
    }
    return total;
  }



  // (dejo estos helpers por si los usás en otro lado)
  cargarProductos() {
    this.prodSrv.getAllProductos().subscribe({
      next: (res: ApiProdResp<ProductoDTO[]> | any) => {
        const lista = (res?.data ?? res?.productos ?? []) as ProductoDTO[];
        this.productos.set(lista);
      },
      error: (err) => console.warn('[VENTA] No pude cargar productos:', err)
    });
  }
  cargarClientes() {
    this.cliSrv.getAllClientes().subscribe({
      next: (res: ApiCliResp<ClienteDTO[]> | any) => {
        const lista = (res?.data ?? res?.clientes ?? []) as ClienteDTO[];
        this.clientes.set(lista);
      },
      error: (err) => console.warn('[VENTA] No pude cargar clientes:', err)
    });
  }

  // ===== CRUD (solo crear, lista) =====
  nuevo() {
    this.form.reset({
      id: null,
      clienteDni: null,
      productoId: null,
      cantidad: 1,
    });
    this.lineas.set([{ productoId: null, cantidad: 1, filtro: '' }]);
    this.submitted.set(false);
    this.error.set(null);
  }

  // líneas crear
  agregarLinea() {
    const arr = [...this.lineas()];
    arr.push({ productoId: null, cantidad: 1, filtro: '' });
    this.lineas.set(arr);
  }
  quitarLinea(idx: number) {
    const arr = [...this.lineas()];
    arr.splice(idx, 1);
    if (arr.length === 0) arr.push({ productoId: null, cantidad: 1, filtro: '' });
    this.lineas.set(arr);
  }

  // ===== helpers =====
  private getProdById(id: number | null | undefined): ProductoDTO | undefined {
    if (id == null) return undefined;
    return this.productos().find(p => p.id === id);
  }

  descDetalle(d: VentaDetalleDTO): string {
    // 1) si viene expandido y con descripción
    if (d?.producto?.descripcion) return d.producto.descripcion;

    // 2) resolvemos el id desde varias formas
    const pid =
      (d as any)?.productoId ??
      (d as any)?.producto?.id ??
      null;

    if (pid != null) {
      // 3) lookup en catálogo
      const p = this.productos().find(x => x.id === Number(pid));
      if (p?.descripcion) return p.descripcion;
      // 4) al menos devolvemos el id
      return `#${pid}`;
    }

    // 5) sin datos
    return '—';
  }


  precioDetalle(d: VentaDetalleDTO): number {
    // usar subtotal si viene
    const sub = (d as any).subtotal;
    if (typeof sub === 'number' && Number.isFinite(sub)) return sub / (Number(d.cantidad) || 1);

    // si no, usar precio del producto expandido
    if (d.producto && typeof d.producto.precio === 'number') return d.producto.precio;

    // último recurso: catálogo
    const p = this.getProdById(d.productoId);
    const raw = p && (p as any).precio;
    const num = typeof raw === 'string' ? Number(raw) : (typeof raw === 'number' ? raw : 0);
    return Number.isFinite(num) ? num : 0;
  }

  getCliente(v: VentaDTO): VentaClienteDTO | null {
    return v.cliente ? v.cliente : null;
  }
  tieneDetalles(v: VentaDTO): boolean {
    return !!(v.detalles && v.detalles.length > 0);
  }
  getDetalles(v: VentaDTO): VentaDetalleDTO[] {
    return v.detalles ? v.detalles : [];
  }
  getProductoDesc(v: VentaDTO): string {
    if (v.producto && typeof v.producto.descripcion === 'string') return v.producto.descripcion;
    const p = v.producto?.id ? this.getProdById(v.producto.id) : undefined;
    return p?.descripcion ?? '—';
  }

  private clienteExiste(dni: string | null): boolean {
    if (!dni) return false;
    return this.clientes().some(c => (c.dni || '') === dni);
  }

  private buildCreatePayload(): CreateVentaDTO {
    const dni = String(this.clienteControl.value || '').trim();
    const detalles: VentaDetalleDTO[] = this.lineas().map(l => ({
      productoId: Number(l.productoId),
      cantidad: Number(l.cantidad),
    }));
    return { clienteDni: dni, detalles };
  }

  private validarLineas(lineas: Linea[]): string | null {
    if (!lineas || lineas.length === 0) return 'Agregá al menos un producto.';
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      if (l.productoId == null) return `Elegí un producto en la línea ${i + 1}.`;
      const cant = Number(l.cantidad);
      if (!cant || cant < 1) return `Ingresá una cantidad válida en la línea ${i + 1}.`;
      const stock = this.getStock(l.productoId);
      if (cant > stock) return `No hay stock suficiente. Disponible: ${stock} unidades.`;
    }
    return null;
  }


  calcularTotal(v: VentaDTO): number {
    // priorizar total del back
    const candidatos = [(v as any).monto, (v as any).montoVenta, (v as any).total];
    for (const x of candidatos) {
      if (typeof x === 'number' && Number.isFinite(x)) return x;
      if (typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x))) return Number(x);
    }

    // sumar subtotales si vienen
    if (v.detalles && v.detalles.length) {
      let sum = 0;
      for (const d of v.detalles) {
        const sub = (d as any).subtotal;
        if (typeof sub === 'number' && Number.isFinite(sub)) {
          sum += sub;
        } else {
          const precio = this.precioDetalle(d);
          const cant = Number(d.cantidad) || 0;
          sum += precio * cant;
        }
      }
      return sum;
    }

    // legacy 1 línea
    let precio = 0;
    if (v.producto && typeof v.producto.precio === 'number') {
      precio = v.producto.precio;
    } else if (v.producto?.id) {
      const p = this.getProdById(v.producto.id);
      const raw = p && (p as any).precio;
      precio = typeof raw === 'string' ? Number(raw) : (typeof raw === 'number' ? raw : 0);
    }
    const cant = typeof v.cantidad === 'number' ? v.cantidad : Number((v as any).cantidad) || 0;
    return (Number.isFinite(precio) ? precio : 0) * cant;
  }

  // ===== submit (solo crear) =====
  guardar() {
    this.submitted.set(true);
    const dni = this.clienteControl.value;

    if (!this.clienteExiste(dni)) {
      this.error.set('El cliente no existe. Crealo primero desde la sección "Clientes".');
      this.clienteControl.markAsTouched();
      return;
    }

    const errLineas = this.validarLineas(this.lineas());
    if (errLineas) {
      this.error.set(errLineas);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload = this.buildCreatePayload();
    this.ventaSrv.createVenta(payload).subscribe({
      next: () => { this.nuevo(); this.cargarVentas(); },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo crear la venta.';
        this.error.set(msg);
        this.loading.set(false);
        console.error('[VENTA] Error creando:', err);
      }
    });
  }
}
