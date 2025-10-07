import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  ApiResponse,
  DecisionDTO,
  CreateDecisionDTO,
  PatchDecisionDTO,
} from '../../models/decision/decision.model';

@Injectable({ providedIn: 'root' })
export class DecisionService {
  private readonly apiPlural = '/api/decisions';
  private readonly apiSingular = '/api/decision';

  constructor(private http: HttpClient) {}

  // ====== GET ======
  private getAllBase(url: string) {
    return this.http.get<ApiResponse<DecisionDTO[]>>(url);
  }
  getAll(): Observable<ApiResponse<DecisionDTO[]>> {
    return this.getAllBase(this.apiPlural).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.getAllBase(this.apiSingular) : throwError(() => err)
      )
    );
  }

  private getByIdBase(url: string, id: number) {
    return this.http.get<ApiResponse<DecisionDTO>>(`${url}/${id}`);
  }
  getById(id: number): Observable<ApiResponse<DecisionDTO>> {
    return this.getByIdBase(this.apiPlural, id).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.getByIdBase(this.apiSingular, id) : throwError(() => err)
      )
    );
  }

  // ====== CREATE ======
  private postBase(url: string, body: any) {
    return this.http.post<ApiResponse<DecisionDTO>>(url, body);
  }
  create(body: CreateDecisionDTO): Observable<ApiResponse<DecisionDTO>> {
    const payload = {
      topicId: Number(body.topicId),
      description: String(body.description).trim(),
      startDate: String(body.startDate),
      endDate: String(body.endDate),
    };
    return this.postBase(this.apiPlural, payload).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.postBase(this.apiSingular, payload) : throwError(() => err)
      )
    );
  }

  // ====== UPDATE (PATCH) ======
  private patchBase(url: string, id: number, body: any) {
    return this.http.patch<ApiResponse<DecisionDTO>>(`${url}/${id}`, body);
  }
  update(id: number, body: PatchDecisionDTO): Observable<ApiResponse<DecisionDTO>> {
    const payload: any = {};
    if (body.topicId != null) payload.topicId = Number(body.topicId);
    if (body.description != null) payload.description = String(body.description).trim();
    if (body.startDate != null) payload.startDate = String(body.startDate);
    if (body.endDate != null) payload.endDate = String(body.endDate);

    return this.patchBase(this.apiPlural, id, payload).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.patchBase(this.apiSingular, id, payload) : throwError(() => err)
      )
    );
  }

  // ====== DELETE con fallbacks ======
  delete(id: number): Observable<{ message: string }> {
    // 1) /api/decisiones/:id
    return this.http.delete<{ message: string }>(`${this.apiPlural}/${id}`).pipe(
      catchError((err1: HttpErrorResponse) => {
        if (err1.status !== 404) return throwError(() => err1);
        // 2) /api/decision/:id
        return this.http.delete<{ message: string }>(`${this.apiSingular}/${id}`).pipe(
          catchError((err2: HttpErrorResponse) => {
            if (err2.status !== 404) return throwError(() => err2);
            // 3) /api/decisiones?id=ID
            return this.http.delete<{ message: string }>(`${this.apiPlural}?id=${id}`).pipe(
              catchError((err3: HttpErrorResponse) => {
                if (err3.status !== 404) return throwError(() => err3);
                // 4) /api/decision?id=ID
                return this.http.delete<{ message: string }>(`${this.apiSingular}?id=${id}`);
              })
            );
          })
        );
      })
    );
  }
}
