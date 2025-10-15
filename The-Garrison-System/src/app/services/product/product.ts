import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  ApiResponse,
  ProductDTO,
  CreateProductDTO,
  UpdateProductDTO,
} from '../../models/product/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = '/api/products';

  /** GET /api/products - Obtiene todos los productos */
  getAllProducts(): Observable<ProductDTO[]> {
    return this.http.get<ApiResponse<ProductDTO[]>>(this.base).pipe(
      map((res: any) => ('data' in res ? res.data : res) as ProductDTO[])
    );
  }

  /** Alias opcional */
  list(): Observable<ProductDTO[]> { 
    return this.getAllProducts(); 
  }

  /** GET /api/products/:id - Obtiene un producto por ID */
  getProduct(id: number): Observable<ProductDTO> {
    return this.http.get<ApiResponse<ProductDTO>>(`${this.base}/${id}`).pipe(
      map((res: any) => ('data' in res ? res.data : res) as ProductDTO)
    );
  }

  /** POST /api/products - Crea un nuevo producto */
  createProduct(payload: CreateProductDTO): Observable<ApiResponse<ProductDTO>> {
    // ✅ NO enviar imageUrl al backend (se maneja en front con ProductImageService)
    const { imageUrl, ...clean } = payload as any;
    return this.http.post<ApiResponse<ProductDTO>>(this.base, clean);
  }

  /** PATCH /api/products/:id - Actualiza un producto */
  updateProduct(id: number, payload: UpdateProductDTO): Observable<ApiResponse<ProductDTO>> {
    // ✅ NO enviar imageUrl al backend
    const { imageUrl, ...clean } = payload as any;
    return this.http.patch<ApiResponse<ProductDTO>>(`${this.base}/${id}`, clean);
  }

  /** DELETE /api/products/:id - Elimina un producto */
  deleteProduct(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}`);
  }

  /** GET /api/products/search - Búsqueda avanzada */
  searchProducts(params: {
    q?: string;
    by?: 'description' | 'legal';
    min?: number;
    max?: number;
    page?: number;
    limit?: number;
  }): Observable<ProductDTO[]> {
    return this.http.get<ApiResponse<ProductDTO[]>>(`${this.base}/search`, { params: params as any }).pipe(
      map((res: any) => ('data' in res ? res.data : res) as ProductDTO[])
    );
  }
}