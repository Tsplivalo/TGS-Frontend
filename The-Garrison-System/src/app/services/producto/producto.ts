import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ProductoDTO, CreateProductoDTO, UpdateProductoDTO } from '../../models/producto/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly apiUrl = '/api/productos';

  constructor(private http: HttpClient) {}

  getAllProductos(): Observable<ApiResponse<ProductoDTO[]>> {
    return this.http.get<ApiResponse<ProductoDTO[]>>(this.apiUrl);
  }

  getProductoById(id: number): Observable<ApiResponse<ProductoDTO>> {
    return this.http.get<ApiResponse<ProductoDTO>>(`${this.apiUrl}/${id}`);
  }

  createProducto(p: CreateProductoDTO): Observable<ApiResponse<ProductoDTO>> {
    return this.http.post<ApiResponse<ProductoDTO>>(this.apiUrl, p);
  }

  updateProducto(id: number, p: UpdateProductoDTO): Observable<ApiResponse<ProductoDTO>> {
    return this.http.patch<ApiResponse<ProductoDTO>>(`${this.apiUrl}/${id}`, p);
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
