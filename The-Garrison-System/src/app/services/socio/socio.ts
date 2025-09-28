import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  SocioDTO,
  //CreateSocioDTO,
  //UpdateSocioDTO,
  SocioStatus,
} from '../../models/socio/socio.model';

@Injectable({ providedIn: 'root' })
export class SocioService {
  private readonly apiUrl = '/api/socios';

  constructor(private http: HttpClient) {}

  getAllSocios(q?: string): Observable<ApiResponse<SocioDTO[]>> {
    let params = new HttpParams();
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<ApiResponse<SocioDTO[]>>(this.apiUrl, { params });
  }

  getSocioById(id: number): Observable<ApiResponse<SocioDTO>> {
    return this.http.get<ApiResponse<SocioDTO>>(`${this.apiUrl}/${id}`);
  }
/*
  createSocio(payload: CreateSocioDTO): Observable<ApiResponse<SocioDTO>> {
    return this.http.post<ApiResponse<SocioDTO>>(this.apiUrl, payload);
  }

  
  updateSocio(id: number, payload: UpdateSocioDTO): Observable<ApiResponse<SocioDTO>> {
    return this.http.patch<ApiResponse<SocioDTO>>(`${this.apiUrl}/${id}`, payload);
  }*/

  patchSocioStatus(id: number, status: SocioStatus): Observable<ApiResponse<SocioDTO>> {
    return this.http.patch<ApiResponse<SocioDTO>>(`${this.apiUrl}/${id}/status`, { status });
  }

  deleteSocio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
