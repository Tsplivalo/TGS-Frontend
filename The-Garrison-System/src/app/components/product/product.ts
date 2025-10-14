import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../services/product/product';
import { ProductImageService } from '../../services/product-image/product-image';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductDTO, CreateProductDTO, UpdateProductDTO } from '../../models/product/product.model';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './product.html',
  styleUrls: ['./product.scss']
})
export class ProductComponent implements OnInit {

  private fb = inject(FormBuilder);
  private srv = inject(ProductService);
  private imgSvc = inject(ProductImageService);
  private t = inject(TranslateService);

  items = signal<ProductDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  editId = signal<number | null>(null);

  form = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    detail:      ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    price:       [0,  [Validators.required, Validators.min(0.01)]],
    stock:       [0,  [Validators.required, Validators.min(0)]],
    isIllegal:   [false],
    imageUrl:    [''] // solo front (no se envía al backend)
  });

  // preview de imagen guardada localmente
  imageFor = (id: number | null) => id ? this.imgSvc.get(id) : null;

  // trackBy correcto para *ngFor
  trackById = (_: number, p: ProductDTO) => p.id;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.list().subscribe({
      next: (list) => { this.items.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message ?? 'products.errors.load'); this.loading.set(false); }
    });
  }

  new() {
    this.editId.set(null);
    this.form.reset({ description: '', detail: '', price: 0, stock: 0, isIllegal: false, imageUrl: '' });
  }

  edit(p: ProductDTO) {
    this.editId.set(p.id);
    this.form.patchValue({
      description: p.description ?? '',
      detail: p.detail ?? '',
      price: p.price,
      stock: p.stock,
      isIllegal: p.isIllegal,
      imageUrl: this.imgSvc.get(p.id) ?? ''
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const val = this.form.getRawValue();

    // Construimos el body SIN imageUrl (el back no lo acepta)
    const base = {
      description: String(val.description ?? '').trim(),
      detail: String(val.detail ?? '').trim(),
      price: Number(val.price),
      stock: Number(val.stock),
      isIllegal: Boolean(val.isIllegal),
    };

    const isEdit = this.editId() != null;

    const req$ = isEdit
      ? this.srv.update(this.editId()!, base as UpdateProductDTO)
      : this.srv.create(base as CreateProductDTO);

    req$.subscribe({
      next: (p) => {
        // persistimos la imagen solo en front
        const img = val.imageUrl?.trim();
        if (img && p?.id) this.imgSvc.set(p.id, img);

        this.new();
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? (isEdit ? 'products.errors.update' : 'products.errors.create'));
        this.loading.set(false);
      }
    });
  }

  remove(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => { this.imgSvc.remove(id); this.loading.set(false); this.load(); },
      error: (err) => { this.error.set(err?.error?.message ?? 'products.errors.delete'); this.loading.set(false); }
    });
  }
}
