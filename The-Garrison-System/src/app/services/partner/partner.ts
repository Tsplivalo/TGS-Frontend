import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  PartnerDTO,
  //CreatePartnerDTO,
  //UpdatePartnerDTO,
  PartnerStatus,
} from '../../models/partner/partner.model';

@Injectable({ providedIn: 'root' })
export class PartnerService {
  private readonly apiUrl = '/api/partners';

  constructor(private http: HttpClient) {}

  getAllPartners(q?: string): Observable<ApiResponse<PartnerDTO[]>> {
    let params = new HttpParams();
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<ApiResponse<PartnerDTO[]>>(this.apiUrl, { params });
  }

  getPartnerById(id: number): Observable<ApiResponse<PartnerDTO>> {
    return this.http.get<ApiResponse<PartnerDTO>>(`${this.apiUrl}/${id}`);
  }
/*
  createPartner(payload: CreatePartnerDTO): Observable<ApiResponse<PartnerDTO>> {
    return this.http.post<ApiResponse<PartnerDTO>>(this.apiUrl, payload);
  }

  
  updatePartner(id: number, payload: UpdatePartnerDTO): Observable<ApiResponse<PartnerDTO>> {
    return this.http.patch<ApiResponse<PartnerDTO>>(`${this.apiUrl}/${id}`, payload);
  }*/

  patchPartnerStatus(id: number, status: PartnerStatus): Observable<ApiResponse<PartnerDTO>> {
    return this.http.patch<ApiResponse<PartnerDTO>>(`${this.apiUrl}/${id}/status`, { status });
  }

  deletePartner(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}