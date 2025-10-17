import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ApiResponse,
  SaleDTO,
  CreateSaleDTO,
  UpdateSaleDTO,
  SaleDetailDTO,
} from '../../models/sale/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private http = inject(HttpClient);
  private base = '/api/sales';

  /** GET /api/sales - Obtiene todas las ventas */
  getAllSales(): Observable<SaleDTO[]> {
    return this.http.get<ApiResponse<SaleDTO[]>>(this.base).pipe(
      map((res: any) => {
        // El backend puede devolver {data: [...]} o directamente [...]
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }

  /** GET /api/sales/:id - Obtiene una venta por ID */
  getSale(id: number): Observable<SaleDTO> {
    return this.http.get<ApiResponse<SaleDTO>>(`${this.base}/${id}`).pipe(
      map((res: any) => {
        if (res?.data) return res.data;
        return res;
      })
    );
  }

  /** POST /api/sales - Crea una nueva venta */
  createSale(payload: CreateSaleDTO): Observable<ApiResponse<SaleDTO>> {
    // ✅ Normalizar datos antes de enviar
    const normalizedPayload: CreateSaleDTO = {
      clientDni: String(payload.clientDni).trim(),
      distributorDni: String(payload.distributorDni).trim(), // ← REQUERIDO
      details: (payload.details || []).map((d: SaleDetailDTO) => ({
        productId: Number(d.productId),
        quantity: Number(d.quantity),
      })),
      person: payload.person ? {
        name: String(payload.person.name).trim(),
        email: String(payload.person.email).trim(),
        phone: payload.person.phone ? String(payload.person.phone).trim() : undefined,
        address: payload.person.address ? String(payload.person.address).trim() : undefined,
      } : undefined,
    };

    return this.http.post<ApiResponse<SaleDTO>>(this.base, normalizedPayload);
  }

  /** PATCH /api/sales/:id - Actualiza una venta (reasignar distribuidor/autoridad) */
  updateSale(id: number, payload: UpdateSaleDTO): Observable<ApiResponse<SaleDTO>> {
    return this.http.patch<ApiResponse<SaleDTO>>(`${this.base}/${id}`, payload);
  }

  /** DELETE /api/sales/:id - Elimina una venta */
  deleteSale(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}`);
  }

  /** GET /api/sales/search - Búsqueda avanzada */
  searchSales(params: {
    q?: string;
    by?: 'client' | 'distributor' | 'zone';
    date?: string;
    type?: 'exact' | 'before' | 'after' | 'between';
    endDate?: string;
    page?: number;
    limit?: number;
  }): Observable<SaleDTO[]> {
    return this.http.get<ApiResponse<SaleDTO[]>>(`${this.base}/search`, { 
      params: params as any 
    }).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
        return [];
      })
    );
  }
}