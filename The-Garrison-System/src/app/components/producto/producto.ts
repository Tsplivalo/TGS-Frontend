import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto/producto';
import { ApiResponse, ProductoDTO, CreateProductoDTO, UpdateProductoDTO } from '../../models/producto/producto.model';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './producto.html',
  styleUrls: ['./producto.scss']
})
export class ProductoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(ProductoService);

  // estado
  loading = signal(false);
  error = signal<string | null>(null);
  editId = signal<number | null>(null);

  // datos
  productos = signal<ProductoDTO[]>([]);

  // filtros
  fTexto = signal('');
  fPrecioMin = signal<number | null>(null);
  fPrecioMax = signal<number | null>(null);
  fStock = signal<'todos' | 'con' | 'sin'>('todos');

  // vista filtrada
  listaFiltrada = computed(() => {
    const txt = this.fTexto().toLowerCase().trim();
    const pmin = this.fPrecioMin();
    const pmax = this.fPrecioMax();
    const fstock = this.fStock();

    return this.productos().filter(p => {
      const matchTxt =
        !txt ||
        p.nombre.toLowerCase().includes(txt) ||
        (p.descripcion ?? '').toLowerCase().includes(txt);

      const matchMin = pmin == null || p.precio >= pmin;
      const matchMax = pmax == null || p.precio <= pmax;

      const matchStock =
        fstock === 'todos' ||
        (fstock === 'con' && p.stock > 0) ||
        (fstock === 'sin' && p.stock === 0);

      return matchTxt && matchMin && matchMax && matchStock;
    });
  });

  // formulario
  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllProductos().subscribe({
      next: (r: ApiResponse<ProductoDTO[]>) => {
        this.productos.set(r.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los productos.');
        this.loading.set(false);
      }
    });
  }

  nuevo() {
    this.editId.set(null);
    this.form.reset({ nombre: '', descripcion: '', precio: 0, stock: 0 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editar(p: ProductoDTO) {
    this.editId.set(p.id);
    this.form.patchValue({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      stock: p.stock
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const dto: CreateProductoDTO = {
      nombre: String(v.nombre),
      descripcion: (v.descripcion ?? '').toString(),
      precio: Number(v.precio),
      stock: Number(v.stock),
    };

    this.loading.set(true);
    this.error.set(null);

    const id = this.editId();
    const obs = id == null
      ? this.srv.createProducto(dto)
      : this.srv.updateProducto(id, {
          nombre: String(v.nombre),
          descripcion: (v.descripcion ?? '').toString(),
          precio: Number(v.precio),
          stock: Number(v.stock),
        });

    obs.subscribe({
      next: () => { this.nuevo(); this.cargar(); },
      error: () => { this.error.set('No se pudo guardar.'); this.loading.set(false); }
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar producto?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteProducto(id).subscribe({
      next: () => this.cargar(),
      error: () => { this.error.set('No se pudo eliminar.'); this.loading.set(false); }
    });
  }
}
