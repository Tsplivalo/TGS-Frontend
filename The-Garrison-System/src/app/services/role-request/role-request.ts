import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  RoleRequest,
  RoleRequestListResponse,
  CreateRoleRequestDTO,
} from '../../models/role-request/role-request.model';

@Injectable({ providedIn: 'root' })
export class RoleRequestService {
  private http = inject(HttpClient);
  private base = '/api/role-requests';

  // Cliente: crea solicitud de cambio de rol
  create(payload: CreateRoleRequestDTO): Observable<RoleRequest> {
    return this.http.post<RoleRequest>(this.base, payload);
  }

  // Admin: lista solicitudes con filtros/paginación
  list(opts?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    q?: string;
    page?: number;
    pageSize?: number;
  }): Observable<RoleRequestListResponse> {
    let params = new HttpParams();
    if (opts?.status) params = params.set('status', opts.status);
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));
    return this.http.get<RoleRequestListResponse>(this.base, { params });
  }

  // Cliente: ver mis solicitudes (historial)
  listMine(): Observable<RoleRequest[]> {
    return this.http.get<RoleRequest[]>(`${this.base}/me`);
  }

  // Admin: aprobar
  approve(id: string, note?: string): Observable<RoleRequest> {
    return this.http.patch<RoleRequest>(`${this.base}/${encodeURIComponent(id)}/approve`, { note });
  }

  // Admin: rechazar
  reject(id: string, reason: string): Observable<RoleRequest> {
    return this.http.patch<RoleRequest>(`${this.base}/${encodeURIComponent(id)}/reject`, { reason });
  }

  // (Opcional) obtener por id
  get(id: string): Observable<RoleRequest> {
    return this.http.get<RoleRequest>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
