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

  // ==== getters para template ====
  get isEditing(): boolean { return !!this.form.controls.id.value; }
  get idValue(): number | null { return this.form.controls.id.value ?? null; }
  get clienteControl() { return this.form.controls.clienteDni; }
  get productoControl() { return this.form.controls.productoId; }
  get cantidadControl() { return this.form.controls.cantidad; }

  ngOnInit(): void {
    this.cargarVentas();
    // Importante: cargo catálogo antes o en paralelo; cuando llega, recalcula vistas automáticamente
    this.cargarProductos();
    this.cargarClientes();
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
    this.loading.set(true);
    this.error.set(null);
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

  // ===== CRUD =====
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

  editar(v: VentaDTO) {
    // tomo la primera línea (si tiene múltiples) para el editor simple
    const pId = v.producto ? v.producto.id : (v.detalles && v.detalles.length ? v.detalles[0].productoId : null);
    const cant = (typeof v.cantidad === 'number') ? v.cantidad :
                 (v.detalles && v.detalles.length ? v.detalles[0].cantidad : 1);

    this.form.setValue({
      id: v.id,
      clienteDni: v.cliente ? v.cliente.dni : null,
      productoId: pId,
      cantidad: cant,
    });

    // fuerza reevaluación de estado y pinta modo edición
    this.form.updateValueAndValidity();
    this.lineas.set([{ productoId: pId, cantidad: cant, filtro: '' }]);
    this.submitted.set(false);
    this.error.set(null);

    // trae el form a la vista (por si estás arriba de la tabla)
    queueMicrotask(() => {
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  eliminar(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.ventaSrv.deleteVenta(id).subscribe({
      next: () => this.cargarVentas(),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo eliminar.');
        this.loading.set(false);
      }
    });
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

  // ===== helpers (lookup cuando no viene expandido) =====
  private getProdById(id: number | null | undefined): ProductoDTO | undefined {
    if (id == null) return undefined;
    return this.productos().find(p => p.id === id);
  }

  descDetalle(d: VentaDetalleDTO): string {
    if (d.producto && d.producto.descripcion) return d.producto.descripcion;
    const p = this.getProdById(d.productoId);
    if (p && p.descripcion) return p.descripcion;
    return `#${d.productoId}`;
  }

  precioDetalle(d: VentaDetalleDTO): number {
    if (d.producto && typeof d.producto.precio === 'number') return d.producto.precio;
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
    // fallback si vino sólo id
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
      if (!l.cantidad || l.cantidad < 1) return `Ingresá una cantidad válida en la línea ${i + 1}.`;
    }
    return null;
  }

  calcularTotal(v: VentaDTO): number {
    if (typeof v.total === 'number') return v.total!;
    if (v.detalles && v.detalles.length) {
      let sum = 0;
      for (const d of v.detalles) {
        sum += this.precioDetalle(d) * (d.cantidad || 0);
      }
      return sum;
    }
    // legacy de 1 línea
    let precio = 0;
    if (v.producto && typeof v.producto.precio === 'number') {
      precio = v.producto.precio;
    } else if (v.producto?.id) {
      const p = this.getProdById(v.producto.id);
      const raw = p && (p as any).precio;
      precio = typeof raw === 'string' ? Number(raw) : (typeof raw === 'number' ? raw : 0);
    }
    const cant = typeof v.cantidad === 'number' ? v.cantidad : 0;
    return (Number.isFinite(precio) ? precio : 0) * cant;
  }

  sumarCantidades(v: VentaDTO): number {
    const det = v.detalles ? v.detalles : [];
    let total = 0;
    for (let i = 0; i < det.length; i++) {
      total += det[i] && typeof det[i].cantidad === 'number' ? det[i].cantidad : 0;
    }
    return total;
  }

  // ===== submit =====
  guardar() {
    this.submitted.set(true);
    const id = this.idValue;
    const creando = !id;

    const dni = this.clienteControl.value;
    if (!this.clienteExiste(dni)) {
      this.error.set('El cliente no existe. Crealo primero desde la sección "Clientes".');
      this.clienteControl.markAsTouched();
      return;
    }

    if (creando) {
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
      return;
    }

    // Editar (una sola línea) + compat
    if (this.productoControl.invalid || this.cantidadControl.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completá Producto y Cantidad.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const patch: UpdateVentaDTO = {
      clienteDni: String(dni),
      detalles: [{
        productoId: Number(this.productoControl.value),
        cantidad: Number(this.cantidadControl.value),
      }],
      // compat opcional:
      productoId: Number(this.productoControl.value),
      cantidad: Number(this.cantidadControl.value),
    };

    this.ventaSrv.updateVenta(id!, patch).subscribe({
      next: () => { this.nuevo(); this.cargarVentas(); },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo guardar la venta.';
        this.error.set(msg);
        this.loading.set(false);
        console.error('[VENTA] Error actualizando:', err);
      }
    });
  }
}
