import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProductService } from '../../services/product/product';
import { ApiResponse, ProductDTO, CreateProductDTO, UpdateProductDTO } from '../../models/product/product.model';
import { ProductImageService } from '../../services/product-image/product-image';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './product.html',
  styleUrls: ['./product.scss']
})
export class ProductComponent implements OnInit {
  // --- Inyección ---
  private fb  = inject(FormBuilder);
  private srv = inject(ProductService);
  private imgSvc = inject(ProductImageService);

  // --- Estado base ---
  loading = signal(false);
  error   = signal<string | null>(null);
  editId  = signal<number | null>(null);

  // --- Datos ---
  products = signal<ProductDTO[]>([]);

  // ✅ AGREGAR:
totalProducts = computed(() => this.products().length);
productsWithStock = computed(() => this.products().filter(p => (p.stock ?? 0) > 0).length);
productsWithoutStock = computed(() => this.products().filter(p => (p.stock ?? 0) === 0).length);

  // --- Filtros de UI ---
  fTextInput = signal('');
  fTextApplied = signal('');
  fStockInput = signal<'all' | 'with' | 'without'>('all');
  fStockApplied = signal<'all' | 'with' | 'without'>('all');

  // Vista filtrada reactiva
  filteredList = computed(() => {
    const txt = this.fTextApplied().toLowerCase().trim();
    const fstock = this.fStockApplied();

    return this.products().filter(p => {
      const matchText =
        !txt ||
        (p.description ?? '').toLowerCase().includes(txt) ||
        (p.detail ?? '').toLowerCase().includes(txt) ||
        String(p.id).includes(txt);

      const matchStock =
        fstock === 'all' ||
        (fstock === 'with' && (p.stock ?? 0) > 0) ||
        (fstock === 'without' && (p.stock ?? 0) === 0);

      return matchText && matchStock;
    });
  });


  applyFilters() {
  this.fTextApplied.set(this.fTextInput());
  this.fStockApplied.set(this.fStockInput());
  }

  clearFilters() {
    this.fTextInput.set('');
    this.fStockInput.set('all');
    this.fTextApplied.set('');
    this.fStockApplied.set('all');
  }

  // --- Previsualización de imagen (solo front) ---
  selectedFile: File | null = null;
  imagePreview = signal<string | null>(null);

  // ✅ CORREGIDO: Agregado campo "detail" requerido por el backend
  form = this.fb.group({
    description: this.fb.control<string>('', { 
      nonNullable: true, 
      validators: [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(50)
      ] 
    }),
    detail: this.fb.control<string>('', { 
      nonNullable: true, 
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ] 
    }),
    price: this.fb.control<number>(0, { 
      nonNullable: true, 
      validators: [Validators.required, Validators.min(0.01)] 
    }),
    stock: this.fb.control<number>(0, { 
      nonNullable: true, 
      validators: [Validators.required, Validators.min(0)] 
    }),
    isIllegal: this.fb.control<boolean>(false, { nonNullable: true }),
    imageUrl: this.fb.control<string>('', { nonNullable: true }),
  });

  // --- Ciclo de vida ---
  ngOnInit() { this.load(); }

  // --- UI: abrir/cerrar sección "nuevo" ---
  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }

  // Fuerza número en inputs de price/stock
  coerceNumber(key: 'price' | 'stock', ev: Event) {
    const input = ev.target as HTMLInputElement;
    const val = input.value === '' ? 0 : Number(input.value);
    this.form.controls[key].setValue(val);
    this.form.controls[key].markAsDirty();
    this.form.controls[key].updateValueAndValidity();
  }

  // Previsualiza cuando se pega una URL
  onImageUrlInput(ev: Event) {
    const val = (ev.target as HTMLInputElement).value?.trim();
    this.imagePreview.set(val || null);
  }

  // Previsualiza cuando se selecciona un archivo local
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.selectedFile = f;

    if (f) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        this.imagePreview.set(dataUrl);
        this.form.controls.imageUrl.setValue(dataUrl);
      };
      reader.readAsDataURL(f);
    } else {
      this.imagePreview.set(null);
    }
  }

  // --- Data fetching ---
  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllProducts().subscribe({
      next: (r: ApiResponse<ProductDTO[]> | ProductDTO[]) => {
        const data = Array.isArray(r) ? r : (r as any).data;
        this.products.set(this.imgSvc.overlay(data ?? []));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al cargar productos');
        this.loading.set(false);
      }
    });
  }

  // Carga un producto en el form para editar
  private loadInForm(p: ProductDTO) {
    this.form.setValue({
      description: p.description ?? '',
      detail: p.detail ?? '',
      price: p.price ?? 0,
      stock: p.stock ?? 0,
      isIllegal: p.isIllegal ?? false,
      imageUrl: p.imageUrl ?? '',
    });
    this.selectedFile = null;
    this.imagePreview.set(p.imageUrl ?? null);
  }

  // --- Crear / Editar ---
  new() {
    this.editId.set(null);
    this.form.reset({
      description: '',
      detail: '',
      price: 0,
      stock: 0,
      isIllegal: false,
      imageUrl: '',
    });
    this.selectedFile = null;
    this.imagePreview.set(null);
    this.isNewOpen = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  edit(p: ProductDTO) {
    this.editId.set(p.id);
    this.loadInForm(p);
    this.isNewOpen = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Guardar ---
  // Reemplazar el método save() completo en product.ts

save() {
  if (this.form.invalid) {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
    return;
  }

  this.loading.set(true);
  this.error.set(null);

  const raw = this.form.getRawValue();
  const img = raw.imageUrl?.trim() || null;

  if (this.editId() == null) {
    // ============================================================================
    // CREATE
    // ============================================================================
    const dtoCreate: CreateProductDTO = {
      description: raw.description,
      detail: raw.detail,
      price: raw.price,
      stock: raw.stock,
      isIllegal: raw.isIllegal
    };

    this.srv.createProduct(dtoCreate).subscribe({
      next: (res: any) => {
        const created = ('data' in res ? res.data : res) as ProductDTO | null;
        if (created?.id) this.imgSvc.set(created.id, img);
        this.loading.set(false);
        this.new();
        this.load();
      },
      error: err => {
        this.loading.set(false);
        this.error.set(this.parseErrorMessage(err, 'crear'));
        console.error('Error creating product:', err);
      }
    });
  } else {
    // ============================================================================
    // UPDATE
    // ============================================================================
    const id = this.editId()!;
    const dtoUpdate: UpdateProductDTO = {
      description: raw.description,
      detail: raw.detail,
      price: raw.price,
      stock: raw.stock,
      isIllegal: raw.isIllegal
    };

    this.srv.updateProduct(id, dtoUpdate).subscribe({
      next: _ => {
        this.imgSvc.set(id, img);
        this.loading.set(false);
        this.new();
        this.load();
      },
      error: err => {
        this.loading.set(false);
        this.error.set(this.parseErrorMessage(err, 'actualizar'));
        console.error('Error updating product:', err);
      }
    });
  }
}

// ============================================================================
// NUEVO MÉTODO: Parser de errores
// ============================================================================
/**
 * Extrae un mensaje de error legible desde la respuesta HTTP
 * @param err - Error de HttpClient
 * @param action - Acción que se estaba realizando ('crear' o 'actualizar')
 * @returns Mensaje de error formateado para el usuario
 */
private parseErrorMessage(err: any, action: 'crear' | 'actualizar'): string {
  // Default message
  let errorMessage = `Error al ${action} producto`;

  if (!err.error) {
    return errorMessage;
  }

  // Caso 1: String simple
  if (typeof err.error === 'string') {
    return err.error;
  }

  // Caso 2: Objeto con propiedad 'message'
  if (err.error.message) {
    errorMessage = err.error.message;
    
    // Mejorar mensajes comunes del backend
    if (errorMessage.includes('already exists')) {
      return `Ya existe un producto con esa descripción. Por favor, usá un nombre diferente.`;
    }
    
    return errorMessage;
  }

  // Caso 3: Array de errores de validación
  if (err.error.errors && Array.isArray(err.error.errors)) {
    const errors = err.error.errors
      .map((e: any) => {
        const field = this.translateFieldName(e.field);
        return `${field}: ${e.message}`;
      })
      .join(', ');
    
    return `Errores de validación: ${errors}`;
  }

  // Caso 4: Código de error HTTP específico
  switch (err.status) {
    case 400:
      return `Datos inválidos. Revisá que todos los campos estén completos correctamente.`;
    case 409:
      return `Ya existe un producto con esa descripción.`;
    case 401:
      return `No tenés permisos para ${action} productos.`;
    case 403:
      return `Acceso denegado.`;
    case 404:
      return `Producto no encontrado.`;
    case 500:
      return `Error del servidor. Intentá de nuevo más tarde.`;
    default:
      return errorMessage;
  }
}

/**
 * Traduce nombres de campos técnicos a español
 * @param field - Nombre técnico del campo
 * @returns Nombre legible en español
 */
private translateFieldName(field: string | undefined): string {
  if (!field) return 'Campo';
  
  const translations: Record<string, string> = {
    'description': 'Descripción',
    'detail': 'Detalle',
    'price': 'Precio',
    'stock': 'Stock',
    'isIllegal': 'Es ilegal'
  };
  
  return translations[field] || field;
}

  // --- Borrado ---
  delete(id: number) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteProduct(id).subscribe({
      next: () => {
        this.imgSvc.remove(id);
        this.loading.set(false);
        this.load();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al eliminar producto');
        this.loading.set(false);
        console.error('Error deleting product:', err);
      }
    });
  }
}