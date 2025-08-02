// src/app/services/venta/venta.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, VentaDTO, CreateVentaDTO } from '../../models/venta/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly apiUrl = '/api/ventas';

  constructor(private http: HttpClient) {}

  getAllVentas(): Observable<ApiResponse<VentaDTO[]>> {
    return this.http.get<ApiResponse<VentaDTO[]>>(this.apiUrl);
  }

  getVentaById(id: number): Observable<ApiResponse<VentaDTO>> {
    return this.http.get<ApiResponse<VentaDTO>>(`${this.apiUrl}/${id}`);
  }

  // <-- aquí cambiamos VentaDTO por CreateVentaDTO
  createVenta(v: CreateVentaDTO): Observable<ApiResponse<VentaDTO>> {
    return this.http.post<ApiResponse<VentaDTO>>(this.apiUrl, v);
  }

  updateVenta(id: number, v: Partial<VentaDTO>): Observable<ApiResponse<VentaDTO>> {
    return this.http.put<ApiResponse<VentaDTO>>(`${this.apiUrl}/${id}`, v);
  }

  patchVenta(id: number, v: Partial<VentaDTO>): Observable<ApiResponse<VentaDTO>> {
    return this.http.patch<ApiResponse<VentaDTO>>(`${this.apiUrl}/${id}`, v);
  }

  deleteVenta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
