import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto/producto';
import { ProductoDTO, CreateProductoDTO } from '../../models/producto/producto.model';

@Component({
  selector: 'app-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './producto.html',
  styleUrls: ['./producto.scss'],
})
export class ProductoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);

  productos: ProductoDTO[] = [];
  createForm!: FormGroup;
  editForm!: FormGroup;
  editingId: number | null = null;

  ngOnInit(): void {
    this.buildForms();
    this.loadProductos();
  }

  buildForms() {
    this.createForm = this.fb.group({
      nombre:    ['', Validators.required],
      descripcion: [''],
      precio:    [0, [Validators.required, Validators.min(0)]],
      stock:     [0, [Validators.required, Validators.min(0)]],
    });

    this.editForm = this.fb.group({
      id:         [{ value: '', disabled: true }],
      nombre:     ['', Validators.required],
      descripcion:[''],
      precio:     [0, [Validators.required, Validators.min(0)]],
      stock:      [0, [Validators.required, Validators.min(0)]],
    });
  }

  loadProductos() {
    this.productoService.getAllProductos().subscribe({
      next: resp => this.productos = resp.data,
      error: err => console.error('Error cargando productos', err)
    });
  }

  onCreate() {
    if (this.createForm.invalid) return;
    const nuevo: CreateProductoDTO = this.createForm.value;
    this.productoService.createProducto(nuevo).subscribe({
      next: () => {
        this.createForm.reset({ nombre: '', descripcion: '', precio: 0, stock: 0 });
        this.loadProductos();
      },
      error: err => console.error('Error creando producto', err)
    });
  }

  startEdit(p: ProductoDTO) {
    this.editingId = p.id;
    this.editForm.setValue({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: p.precio,
      stock: p.stock
    });
  }

  cancelEdit() {
    this.editingId = null;
  }

  saveEdit() {
    if (!this.editingId || this.editForm.invalid) return;
    const cambios = this.editForm.getRawValue() as CreateProductoDTO;
    this.productoService.updateProducto(this.editingId, cambios).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadProductos();
      },
      error: err => console.error('Error actualizando producto', err)
    });
  }

  deleteProducto(id: number) {
    this.productoService.deleteProducto(id).subscribe({
      next: () => this.loadProductos(),
      error: err => console.error('Error eliminando producto', err)
    });
  }
}
