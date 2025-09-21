import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto/producto';
import { ApiResponse, ProductoDTO, CreateProductoDTO } from '../../models/producto/producto.model';

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

  //todos los formularios son reactivos(se actualizan en tiempo real con el back, sin necesidad de hacerlo desde el html)

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
        (p.descripcion ?? '').toLowerCase().includes(txt) ||
        String(p.id).includes(txt); // por si querés filtrar por id

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
    descripcion: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
    precio: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    stock: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    esIlegal: this.fb.control<boolean>(false, { nonNullable: true }),
  });

  // esto  hace que apenas se carga el front se muestren todos los productos ya cargados
  ngOnInit() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllProductos().subscribe({
      next: (r: ApiResponse<ProductoDTO[]> | ProductoDTO[]) => {
        const data = Array.isArray(r) ? r : r.data;
        this.productos.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo cargar la lista.');
        this.loading.set(false);
      }
    });
  }

  private cargarEnFormulario(p: ProductoDTO) {
    this.form.setValue({
      descripcion: p.descripcion ?? '',
      precio: p.precio ?? 0,
      stock: p.stock ?? 0,
      esIlegal: p.esIlegal ?? false,
    });
  }

  nuevo() {
    this.editId.set(null);
    this.form.reset({
      descripcion: '',
      precio: 0,
      stock: 0,
      esIlegal: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editar(p: ProductoDTO) {
    this.editId.set(p.id);
    this.cargarEnFormulario(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardar() {
    if (this.form.invalid) return;

    const dto: CreateProductoDTO = this.form.getRawValue();

    this.loading.set(true);
    this.error.set(null);

    const obs = this.editId() == null
      ? this.srv.createProducto(dto)
      : this.srv.updateProducto(this.editId()!, dto);

    obs.subscribe({
      next: _ => {
        this.loading.set(false);
        this.nuevo();
        this.cargar(); // 🔁 recarga lista
      },
      error: err => {
        this.loading.set(false);
        // mensajes comunes: 401/403 si no sos ADMIN, 400 si falta algún campo
        this.error.set(err?.error?.message ?? 'No se pudo guardar');
      }
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar producto?')) return; 
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteProducto(id).subscribe({
      next: () => { this.loading.set(false); this.cargar(); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo eliminar.');
        this.loading.set(false);
      }
    });
  }
}
