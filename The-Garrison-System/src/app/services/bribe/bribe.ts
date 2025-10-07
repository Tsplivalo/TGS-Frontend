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
  private readonly apiSingular = '/api/bribe';

  constructor(private http: HttpClient) {}

  // ===== LIST =====
  getAll(): Observable<{ bribes?: BribeDTO[] } & ApiResponse<BribeDTO[]>> {
    return this.http.get<{ bribes?: BribeDTO[] } & ApiResponse<BribeDTO[]>>(this.apiPlural)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.get<{ bribes?: BribeDTO[] } & ApiResponse<BribeDTO[]>>(this.apiSingular);
          }
          return throwError(() => err);
        })
      );
  }

  // ===== GET BY ID =====
  getById(id: number): Observable<BribeDTO | ApiResponse<BribeDTO>> {
    return this.http.get<BribeDTO | ApiResponse<BribeDTO>>(`${this.apiPlural}/${id}`)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.get<BribeDTO | ApiResponse<BribeDTO>>(`${this.apiSingular}/${id}`);
          }
          return throwError(() => err);
        })
      );
  }

  // ===== CREATE (POST /bribes) =====
  create(body: CreateBribeDTO): Observable<BribeDTO | ApiResponse<BribeDTO>> {
    // Ensure types
    const payload: CreateBribeDTO = {
      amount: Number(body.amount),
      authorityId: String(body.authorityId),
      saleId: Number(body.saleId),
      paid: !!body.paid,
    };
    return this.http.post<BribeDTO | ApiResponse<BribeDTO>>(this.apiPlural, payload)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.post<BribeDTO | ApiResponse<BribeDTO>>(this.apiSingular, payload);
          }
          return throwError(() => err);
        })
      );
  }

  // ===== Partial UPDATE (PATCH /bribes/:id) =====
  update(id: number, body: UpdateBribeDTO): Observable<BribeDTO | ApiResponse<BribeDTO>> {
    const payload: any = {};
    if ('amount' in body && body.amount != null) payload.amount = Number(body.amount);
    if ('authorityId' in body && body.authorityId != null) payload.authorityId = String(body.authorityId);
    if ('saleId' in body && body.saleId != null) payload.saleId = Number(body.saleId);
    if ('paid' in body && body.paid != null) payload.paid = !!body.paid;
    if ('creationDate' in body && (body as any).creationDate != null) payload.creationDate = (body as any).creationDate;

    return this.http.patch<BribeDTO | ApiResponse<BribeDTO>>(`${this.apiPlural}/${id}`, payload)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.patch<BribeDTO | ApiResponse<BribeDTO>>(`${this.apiSingular}/${id}`, payload);
          }
          return throwError(() => err);
        })
      );
  }

  // ===== MARK AS PAID (special PATCH) =====
  pay(ids: number | number[]) {
    return this.http.patch<{ message: string }>(`${this.apiPlural}/pay`, { ids })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.patch<{ message: string }>(`${this.apiSingular}/pay`, { ids });
          }
          return throwError(() => err);
        })
      );
  }

  payFromAuthority(dni: string, ids: number | number[]) {
    return this.http.patch<{ message: string }>(`${this.apiPlural}/${dni}/pay`, { ids })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.patch<{ message: string }>(`${this.apiSingular}/${dni}/pay`, { ids });
          }
          return throwError(() => err);
        })
      );
  }
}