import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../services/product/product';
import { ApiResponse, ProductDTO, CreateProductDTO, UpdateProductDTO } from '../../models/product/product.model';
import { ProductImageService } from '../../services/product-image/product-image';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product.html',
  styleUrls: ['./product.scss']
})
export class ProductComponent implements OnInit {
  private fb  = inject(FormBuilder);
  private srv = inject(ProductService);
  private imgSvc = inject(ProductImageService);

  // state
  loading = signal(false);
  error   = signal<string | null>(null);
  editId  = signal<number | null>(null);

  // data
  products = signal<ProductDTO[]>([]);

  // filters
  fText  = signal('');
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
        (fstock === 'with'     && (p.stock ?? 0) > 0) ||
        (fstock === 'without'  && (p.stock ?? 0) === 0);

      return matchText && matchStock;
    });
  });

  // preview (solo front)
  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null);

  // form (incluye imageUrl solo para uso de front/localStorage)
  form = this.fb.group({
    description: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
    price:       this.fb.control<number>(0,   { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    stock:       this.fb.control<number>(0,   { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    isIllegal:   this.fb.control<boolean>(false, { nonNullable: true }),
    imageUrl:    this.fb.control<string>('', { nonNullable: true }),
  });

  ngOnInit() { this.load(); }

  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }

  coerceNumber(key: 'price' | 'stock', ev: Event) {
    const input = ev.target as HTMLInputElement;
    const val = input.value === '' ? 0 : Number(input.value);
    this.form.controls[key].setValue(val);
    this.form.controls[key].markAsDirty();
    this.form.controls[key].updateValueAndValidity();
  }

  onImageUrlInput(ev: Event) {
    const val = (ev.target as HTMLInputElement).value?.trim();
    this.imagePreview.set(val || null);
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.selectedFile = f;

    if (f) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        this.imagePreview.set(dataUrl);
        // Si querés, también lo colocamos en el control para que se guarde como URL local
        this.form.controls.imageUrl.setValue(dataUrl);
      };
      reader.readAsDataURL(f);
    } else {
      this.imagePreview.set(null);
    }
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllProducts().subscribe({
      next: (r: ApiResponse<ProductDTO[]> | ProductDTO[]) => {
        const data = Array.isArray(r) ? r : (r as any).data;
        // superponemos las imágenes locales (solo front)
        this.products.set(this.imgSvc.overlay(data ?? []));
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
      imageUrl: p.imageUrl ?? '',
    });
    this.selectedFile = null;
    this.imagePreview.set(p.imageUrl ?? null);
  }

  new() {
    this.editId.set(null);
    this.form.reset({
      description: '',
      price: 0,
      stock: 0,
      isIllegal: false,
      imageUrl: '',
    });
    this.selectedFile = null;
    this.imagePreview.set(null);
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

    const raw = this.form.getRawValue();
    const img = raw.imageUrl?.trim() || null;

    // NO enviamos imageUrl al backend (solo front)
    const { imageUrl: _ignore, ...clean } = raw as any;

    if (this.editId() == null) {
      const dtoCreate: CreateProductDTO = clean;
      this.srv.createProduct(dtoCreate).subscribe({
        next: (res: any) => {
          const created = ('data' in res ? res.data : res) as ProductDTO | null;
          if (created?.id) this.imgSvc.set(created.id, img); // guardamos imagen local por id creado
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
      const id = this.editId()!;
      const dtoUpdate: UpdateProductDTO = clean;
      this.srv.updateProduct(id, dtoUpdate).subscribe({
        next: _ => {
          this.imgSvc.set(id, img); // actualizamos imagen local
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
      next: () => {
        this.imgSvc.remove(id); // limpiamos imagen local
        this.loading.set(false);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Could not delete.');
        this.loading.set(false);
      }
    });
  }
}
