import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ApiResponse,
  SaleDTO,
  CreateSaleDTO,
  UpdateSaleDTO,
  SaleDetailDTO,
} from '../../models/sale/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly apiPlural = '/api/sales';
  private readonly apiSingular = '/api/sale';

  constructor(private http: HttpClient) {}

  // ===== Helpers with fallback plural⇄singular =====
  private getAllBase(url: string) {
    return this.http.get<ApiResponse<SaleDTO[]>>(url);
  }
  getAllSales(): Observable<ApiResponse<SaleDTO[]>> {
    return this.getAllBase(this.apiPlural).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.getAllBase(this.apiSingular) : throwError(() => err)
      )
    );
  }

  private postBase(url: string, body: any) {
    return this.http.post<ApiResponse<SaleDTO>>(url, body);
  }
  createSale(body: CreateSaleDTO): Observable<ApiResponse<SaleDTO>> {
    // Normalize types
    const details = (body.details || []).map((d: SaleDetailDTO) => ({
      productId: Number(d.productId),
      quantity: Number(d.quantity),
    }));

    const payload: CreateSaleDTO = {
      clientDni: String(body.clientDni).trim(),
      details,
    };

    return this.postBase(this.apiPlural, payload).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.postBase(this.apiSingular, payload) : throwError(() => err)
      )
    );
  }

  private patchBase(url: string, id: number, body: any) {
    return this.http.patch<ApiResponse<SaleDTO>>(`${url}/${id}`, body);
  }
  updateSale(id: number, body: UpdateSaleDTO): Observable<ApiResponse<SaleDTO>> {
    const payload: UpdateSaleDTO = {};
    if (body.clientDni != null) payload.clientDni = String(body.clientDni).trim();

    if (body.details != null) {
      payload.details = body.details.map(d => ({
        productId: Number(d.productId),
        quantity: Number(d.quantity),
      }));
    }
    // Compat: if your back still accepts productId/quantity in PATCH
    if (body.productId != null) payload.productId = Number(body.productId);
    if (body.quantity != null) payload.quantity = Number(body.quantity);

    return this.patchBase(this.apiPlural, id, payload).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.patchBase(this.apiSingular, id, payload) : throwError(() => err)
      )
    );
  }


  
}