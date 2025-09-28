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
  fStock = signal<'todos' | 'con' | 'sin'>('todos');

  // vista filtrada
  listaFiltrada = computed(() => {
    const txt = this.fTexto().toLowerCase().trim();

    const fstock = this.fStock();

    return this.productos().filter(p => {
      const matchTxt =
        !txt ||
        (p.descripcion ?? '').toLowerCase().includes(txt) ||
        String(p.id).includes(txt);


      const matchStock =
        fstock === 'todos' ||
        (fstock === 'con' && p.stock > 0) ||
        (fstock === 'sin' && p.stock === 0);

      return matchTxt && matchStock;
    });
  });

  // formulario
  form = this.fb.group({
    descripcion: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
    precio: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    stock: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    esIlegal: this.fb.control<boolean>(false, { nonNullable: true }),
  });

  ngOnInit() {
    this.cargar();
  }

  nuevoAbierto = false;
  toggleNuevo(){ this.nuevoAbierto = !this.nuevoAbierto; }

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

    this.loading.set(true);
    this.error.set(null);

    if (this.editId() == null) {
      // CREATE -> POST con CreateProductoDTO
      const dtoCreate: CreateProductoDTO = this.form.getRawValue();
      this.srv.createProducto(dtoCreate).subscribe({
        next: _ => {
          this.loading.set(false);
          this.nuevo();
          this.cargar();
        },
        error: err => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo guardar');
        }
      });
    } else {
      // UPDATE -> PATCH con UpdateProductoDTO
      const id = this.editId()!;
      const raw = this.form.getRawValue();
      const dtoUpdate: UpdateProductoDTO = { ...raw }; // parcial/total según tu modelo

      this.srv.updateProducto(id, dtoUpdate).subscribe({
        next: _ => {
          this.loading.set(false);
          this.nuevo();
          this.cargar();
        },
        error: err => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'No se pudo guardar');
        }
      });
    }
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
