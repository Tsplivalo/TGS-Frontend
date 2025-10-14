import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  ApiResponse,
  SaleDTO,
  CreateSaleDTO,
  UpdateSaleDTO,
} from '../../models/sale/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly apiPlural = '/api/sales';
  private readonly apiSingular = '/api/sale';

  constructor(private http: HttpClient) {}

  /** Lista de ventas (usa /api/sales y hace fallback a /api/sale si existe así en tu back) */
  list(): Observable<SaleDTO[]> {
    return this.http.get<ApiResponse<SaleDTO[]>>(this.apiPlural).pipe(
      map((res: any) => (res?.data ?? res) as SaleDTO[]),
      catchError((err: HttpErrorResponse) =>
        err.status === 404
          ? this.http.get<ApiResponse<SaleDTO[]>>(this.apiSingular).pipe(
              map((r: any) => (r?.data ?? r) as SaleDTO[])
            )
          : throwError(() => err)
      )
    );
  }

  /** ✅ Alias para compatibilidad con componentes existentes (bribe) */
  getAllSales(): Observable<SaleDTO[]> {
    return this.list();
  }

  /** Crea una venta con el schema del back: { clientDni, details: [{productId, quantity}] } */
  createSale(body: CreateSaleDTO): Observable<SaleDTO> {
    const payload: any = {
      clientDni: String(body.clientDni),
      details: (body.details ?? []).map(d => ({
        productId: Number(d.productId),
        quantity: Number(d.quantity),
      })),
    };
    return this.http.post<ApiResponse<SaleDTO>>(this.apiPlural, payload).pipe(
      map((res: any) => (res?.data ?? res) as SaleDTO)
    );
  }

  /** Actualiza una venta (normalizo tipos por las validaciones del back) */
  updateSale(id: number, patch: UpdateSaleDTO): Observable<SaleDTO> {
    const payload: any = {};
    if (patch.clientDni != null) payload.clientDni = String(patch.clientDni);
    if (patch.details) {
      payload.details = patch.details.map(d => ({
        productId: Number(d.productId),
        quantity: Number(d.quantity),
      }));
    }
    return this.http.patch<ApiResponse<SaleDTO>>(`${this.apiPlural}/${id}`, payload).pipe(
      map((res: any) => (res?.data ?? res) as SaleDTO),
      catchError((err: HttpErrorResponse) =>
        err.status === 404
          ? this.http.patch<ApiResponse<SaleDTO>>(`${this.apiSingular}/${id}`, payload).pipe(
              map((r: any) => (r?.data ?? r) as SaleDTO)
            )
          : throwError(() => err)
      )
    );
  }
}
