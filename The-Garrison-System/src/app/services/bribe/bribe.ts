import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ApiResponse,
  BribeDTO,
  CreateBribeDTO,
  UpdateBribeDTO,
} from '../../models/bribe/bribe.model';

@Injectable({ providedIn: 'root' })
export class BribeService {
  private readonly apiPlural = '/api/bribes';

  constructor(private http: HttpClient) {}

  // ===== LIST =====
  list(): Observable<BribeDTO[] | ApiResponse<BribeDTO[]>> {
    return this.http.get<BribeDTO[] | ApiResponse<BribeDTO[]>>(this.apiPlural);
  }

  // ===== CREATE =====
  create(body: CreateBribeDTO): Observable<BribeDTO | ApiResponse<BribeDTO>> {
    const payload = {
      amount: Number(body.amount),
      authorityId: String(body.authorityId),
      saleId: Number(body.saleId),
      paid: !!body.paid,
    };
    return this.http.post<BribeDTO | ApiResponse<BribeDTO>>(this.apiPlural, payload);
  }

  // ===== UPDATE PARCIAL (si tu backend tuviera PATCH /bribes/:id genérico) =====
  // Mantengo por compatibilidad para otros campos NO relacionados a "paid".
  update(id: number, body: UpdateBribeDTO): Observable<BribeDTO | ApiResponse<BribeDTO>> {
    const payload: any = {};
    if ('amount' in body && body.amount != null) payload.amount = Number(body.amount);
    if ('authorityId' in body && body.authorityId != null) payload.authorityId = String(body.authorityId);
    if ('saleId' in body && body.saleId != null) payload.saleId = Number(body.saleId);
    if ('creationDate' in body && (body as any).creationDate != null) payload.creationDate = (body as any).creationDate;

    return this.http.patch<BribeDTO | ApiResponse<BribeDTO>>(`${this.apiPlural}/${id}`, payload);
  }

  // ===== PAY (UNO) =====
  payOne(id: number) {
    // El schema de pay acepta { ids } incluso en :id/pay; enviarlo es seguro.
    return this.http.patch<{ message: string }>(`${this.apiPlural}/${id}/pay`, { ids: id });
  }

  // ===== PAY (VARIOS) =====
  payMany(ids: number[]) {
    return this.http.patch<{ message: string }>(`${this.apiPlural}/pay`, { ids });
  }

  // ===== PAY POR AUTORIDAD (si usás el flujo por DNI) =====
  payFromAuthority(dni: string, ids: number | number[]) {
    return this.http.patch<{ message: string }>(`${this.apiPlural}/${dni}/pay`, { ids });
  }

  // ===== DELETE =====
  delete(id: number) {
    return this.http.delete<{ message: string }>(`${this.apiPlural}/${id}`);
  }
}
