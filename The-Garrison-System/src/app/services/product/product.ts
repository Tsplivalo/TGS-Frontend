import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  ProductDTO,
  CreateProductDTO,
  UpdateProductDTO,
} from '../../models/product/product.model';

type ApiResponse<T = any> = { data: T } | T;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = '/api/products';

  list(): Observable<ProductDTO[]> {
    return this.http.get<ApiResponse<ProductDTO[]>>(this.base).pipe(
      map((res: any) => (res?.data ?? res) as ProductDTO[])
    );
  }

  /** ✅ Alias para compatibilidad con componentes existentes (store) */
  getAllProducts(): Observable<ProductDTO[]> {
    return this.list();
  }

  search(q: string, by: 'description' | 'legal' = 'description'): Observable<ProductDTO[]> {
    let params = new HttpParams().set('q', q);
    if (by) params = params.set('by', by);
    return this.http.get<ApiResponse<ProductDTO[]>>(`${this.base}/search`, { params }).pipe(
      map((res: any) => (res?.data ?? res) as ProductDTO[])
    );
  }

  get(id: number): Observable<ProductDTO> {
    return this.http.get<ApiResponse<ProductDTO>>(`${this.base}/${id}`).pipe(
      map((res: any) => (res?.data ?? res) as ProductDTO)
    );
  }

  create(payload: CreateProductDTO): Observable<ProductDTO> {
    const { imageUrl, ...body } = payload as any;
    (body.price as any) = Number(body.price);
    (body.stock as any) = Number(body.stock);
    (body.isIllegal as any) = Boolean(body.isIllegal);
    return this.http.post<ApiResponse<ProductDTO>>(this.base, body).pipe(
      map((res: any) => (res?.data ?? res) as ProductDTO)
    );
  }

  update(id: number, payload: UpdateProductDTO): Observable<ProductDTO> {
    const { imageUrl, ...clean } = payload as any;
    if (clean.price != null) clean.price = Number(clean.price);
    if (clean.stock != null) clean.stock = Number(clean.stock);
    if (clean.isIllegal != null) clean.isIllegal = Boolean(clean.isIllegal);
    return this.http.patch<ApiResponse<ProductDTO>>(`${this.base}/${id}`, clean).pipe(
      map((res: any) => (res?.data ?? res) as ProductDTO)
    );
  }

  delete(id: number): Observable<unknown> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}`);
  }
}
