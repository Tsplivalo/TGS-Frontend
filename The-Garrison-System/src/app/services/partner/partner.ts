// src/app/services/partner/partner.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  PartnerDTO,
  CreatePartnerDTO,
  PatchPartnerDTO,
  PartnerListResponse,
  PartnerItemResponse,
} from '../../models/partner/partner.model';

@Injectable({ providedIn: 'root' })
export class PartnerService {
  private http = inject(HttpClient);
  private base = '/api/partners';

  list(opts?: { q?: string; page?: number; pageSize?: number }) {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));
    return this.http.get<PartnerListResponse>(this.base, { params });
  }

  get(dni: string) {
    return this.http.get<PartnerItemResponse>(`${this.base}/${encodeURIComponent(dni)}`);
  }

  create(payload: CreatePartnerDTO) {
    return this.http.post<PartnerItemResponse>(this.base, payload);
  }

  update(dni: string, payload: PatchPartnerDTO) {
    return this.http.patch<PartnerItemResponse>(`${this.base}/${encodeURIComponent(dni)}`, payload);
  }

  delete(dni: string) {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(dni)}`);
  }

  // relaciones con decisiones
  attachDecision(dni: string, decisionId: number) {
    return this.http.post<PartnerItemResponse>(`${this.base}/${encodeURIComponent(dni)}/decisions/${decisionId}`, {});
  }

  detachDecision(dni: string, decisionId: number) {
    return this.http.delete<PartnerItemResponse>(`${this.base}/${encodeURIComponent(dni)}/decisions/${decisionId}`);
  }
}
