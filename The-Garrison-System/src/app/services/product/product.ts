import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ProductDTO, CreateProductDTO, UpdateProductDTO } from '../../models/product/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = '/api/products';

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<ApiResponse<ProductDTO[]>> {
    return this.http.get<ApiResponse<ProductDTO[]>>(this.apiUrl);
  }

  getProductById(id: number): Observable<ApiResponse<ProductDTO>> {
    return this.http.get<ApiResponse<ProductDTO>>(`${this.apiUrl}/${id}`);
  }

  createProduct(p: CreateProductDTO): Observable<ApiResponse<ProductDTO>> {
    return this.http.post<ApiResponse<ProductDTO>>(this.apiUrl, p);
  }

  updateProduct(id: number, p: UpdateProductDTO): Observable<ApiResponse<ProductDTO>> {
    return this.http.patch<ApiResponse<ProductDTO>>(`${this.apiUrl}/${id}`, p);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}