import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ApiResponse,
  SobornoDTO,
  CreateSobornoDTO,
  UpdateSobornoDTO,
} from '../../models/soborno/soborno.model';

@Injectable({ providedIn: 'root' })
export class SobornoService {
  private readonly apiPlural = '/api/sobornos';
  private readonly apiSingular = '/api/soborno';

  constructor(private http: HttpClient) {}

  // ===== LISTA =====
  getAll(): Observable<{ sobornos?: SobornoDTO[] } & ApiResponse<SobornoDTO[]>> {
    return this.http.get<{ sobornos?: SobornoDTO[] } & ApiResponse<SobornoDTO[]>>(this.apiPlural)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.get<{ sobornos?: SobornoDTO[] } & ApiResponse<SobornoDTO[]>>(this.apiSingular);
          }
          return throwError(() => err);
        })
      );
  }

  // ===== GET BY ID =====
  getById(id: number): Observable<SobornoDTO | ApiResponse<SobornoDTO>> {
    return this.http.get<SobornoDTO | ApiResponse<SobornoDTO>>(`${this.apiPlural}/${id}`)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.get<SobornoDTO | ApiResponse<SobornoDTO>>(`${this.apiSingular}/${id}`);
          }
          return throwError(() => err);
        })
      );
  }

  // ===== CREATE (POST /sobornos) =====
  create(body: CreateSobornoDTO): Observable<SobornoDTO | ApiResponse<SobornoDTO>> {
    // Aseguramos tipos
    const payload: CreateSobornoDTO = {
      monto: Number(body.monto),
      autoridadId: String(body.autoridadId),
      ventaId: Number(body.ventaId),
      pagado: !!body.pagado,
    };
    return this.http.post<SobornoDTO | ApiResponse<SobornoDTO>>(this.apiPlural, payload)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.post<SobornoDTO | ApiResponse<SobornoDTO>>(this.apiSingular, payload);
          }
          return throwError(() => err);
        })
      );
  }

  // ===== UPDATE parcial (PATCH /sobornos/:id) =====
  update(id: number, body: UpdateSobornoDTO): Observable<SobornoDTO | ApiResponse<SobornoDTO>> {
    const payload: any = {};
    if ('monto' in body && body.monto != null) payload.monto = Number(body.monto);
    if ('autoridadId' in body && body.autoridadId != null) payload.autoridadId = String(body.autoridadId);
    if ('ventaId' in body && body.ventaId != null) payload.ventaId = Number(body.ventaId);
    if ('pagado' in body && body.pagado != null) payload.pagado = !!body.pagado;
    if ('fechaCreacion' in body && (body as any).fechaCreacion != null) payload.fechaCreacion = (body as any).fechaCreacion;

    return this.http.patch<SobornoDTO | ApiResponse<SobornoDTO>>(`${this.apiPlural}/${id}`, payload)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.patch<SobornoDTO | ApiResponse<SobornoDTO>>(`${this.apiSingular}/${id}`, payload);
          }
          return throwError(() => err);
        })
      );
  }

  // ===== MARCAR PAGADO (PATCH especiales) =====
  pagar(ids: number | number[]) {
    return this.http.patch<{ message: string }>(`${this.apiPlural}/pagar`, { ids })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.patch<{ message: string }>(`${this.apiSingular}/pagar`, { ids });
          }
          return throwError(() => err);
        })
      );
  }

  pagarDeAutoridad(dni: string, ids: number | number[]) {
    return this.http.patch<{ message: string }>(`${this.apiPlural}/${dni}/pagar`, { ids })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http.patch<{ message: string }>(`${this.apiSingular}/${dni}/pagar`, { ids });
          }
          return throwError(() => err);
        })
      );
  }
}
