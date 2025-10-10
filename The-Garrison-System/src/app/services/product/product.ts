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
  // ✅ Ruta correcta del back
  private base = '/api/products';

  /** GET /api/products */
  getAllProducts(): Observable<ProductDTO[]> {
    return this.http.get<ApiResponse<ProductDTO[]>>(this.base).pipe(
      map((res: any) => ('data' in res ? res.data : res) as ProductDTO[])
    );
  }

  /** Alias opcional */
  list(): Observable<ProductDTO[]> { return this.getAllProducts(); }

  /** GET /api/products/:id */
  getProduct(id: number): Observable<ProductDTO> {
    return this.http.get<ApiResponse<ProductDTO>>(`${this.base}/${id}`).pipe(
      map((res: any) => ('data' in res ? res.data : res) as ProductDTO)
    );
  }

  /** POST /api/products */
  createProduct(payload: CreateProductDTO): Observable<ApiResponse<ProductDTO>> {
    // ✅ NO enviar imageUrl al back (se maneja en front)
    const { imageUrl, ...clean } = payload as any;
    return this.http.post<ApiResponse<ProductDTO>>(this.base, clean);
  }

  /** PATCH /api/products/:id */
  updateProduct(id: number, payload: UpdateProductDTO): Observable<ApiResponse<ProductDTO>> {
    // ✅ NO enviar imageUrl al back
    const { imageUrl, ...clean } = payload as any;
    return this.http.patch<ApiResponse<ProductDTO>>(`${this.base}/${id}`, clean);
  }

  /** DELETE /api/products/:id */
  deleteProduct(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}`);
  }
}
