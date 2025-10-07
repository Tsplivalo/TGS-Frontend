import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../services/product/product';
import { ApiResponse, ProductDTO, CreateProductDTO, UpdateProductDTO } from '../../models/product/product.model';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product.html',
  styleUrls: ['./product.scss']
})
export class ProductComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(ProductService);

  // state
  loading = signal(false);
  error = signal<string | null>(null);
  editId = signal<number | null>(null);

  // data
  products = signal<ProductDTO[]>([]);

  // filters
  fText = signal('');
  fStock = signal<'all' | 'with' | 'without'>('all');

  // filtered view
  filteredList = computed(() => {
    const txt = this.fText().toLowerCase().trim();

    const fstock = this.fStock();

    return this.products().filter(p => {
      const matchText =
        !txt ||
        (p.description ?? '').toLowerCase().includes(txt) ||
        String(p.id).includes(txt);


      const matchStock =
        fstock === 'all' ||
        (fstock === 'with' && p.stock > 0) ||
        (fstock === 'without' && p.stock === 0);

      return matchText && matchStock;
    });
  });

  // form
  form = this.fb.group({
    description: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
    price: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    stock: this.fb.control<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    isIllegal: this.fb.control<boolean>(false, { nonNullable: true }),
  });

  ngOnInit() {
    this.load();
  }

  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }

  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllProducts().subscribe({
      next: (r: ApiResponse<ProductDTO[]> | ProductDTO[]) => {
        const data = Array.isArray(r) ? r : r.data;
        this.products.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Could not load the list.');
        this.loading.set(false);
      }
    });
  }

  private loadInForm(p: ProductDTO) {
    this.form.setValue({
      description: p.description ?? '',
      price: p.price ?? 0,
      stock: p.stock ?? 0,
      isIllegal: p.isIllegal ?? false,
    });
  }

  new() {
    this.editId.set(null);
    this.form.reset({
      description: '',
      price: 0,
      stock: 0,
      isIllegal: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  edit(p: ProductDTO) {
    this.editId.set(p.id);
    this.loadInForm(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  save() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    if (this.editId() == null) {
      // CREATE -> POST with CreateProductDTO
      const dtoCreate: CreateProductDTO = this.form.getRawValue();
      this.srv.createProduct(dtoCreate).subscribe({
        next: _ => {
          this.loading.set(false);
          this.new();
          this.load();
        },
        error: err => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'Could not save');
        }
      });
    } else {
      // UPDATE -> PATCH with UpdateProductDTO
      const id = this.editId()!;
      const raw = this.form.getRawValue();
      const dtoUpdate: UpdateProductDTO = { ...raw }; // partial/total according to your model

      this.srv.updateProduct(id, dtoUpdate).subscribe({
        next: _ => {
          this.loading.set(false);
          this.new();
          this.load();
        },
        error: err => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'Could not save');
        }
      });
    }
  }

  delete(id: number) {
    if (!confirm('Delete product?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteProduct(id).subscribe({
      next: () => { this.loading.set(false); this.load(); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Could not delete.');
        this.loading.set(false);
      }
    });
  }
}