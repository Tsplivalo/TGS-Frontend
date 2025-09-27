import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  AutoridadDTO,
  CreateAutoridadDTO,
  UpdateAutoridadDTO,
  PatchAutoridadDTO,
} from '../../models/autoridad/autoridad.model';

@Injectable({ providedIn: 'root' })
export class AutoridadService {
  private readonly apiUrl = '/api/autoridades';

  constructor(private http: HttpClient) {}

  getAllAutoridades(params?: { zonaId?: string; q?: string }): Observable<ApiResponse<AutoridadDTO[]>> {
    let httpParams = new HttpParams();
    if (params?.zonaId) httpParams = httpParams.set('zonaId', params.zonaId);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    return this.http.get<ApiResponse<AutoridadDTO[]>>(this.apiUrl, { params: httpParams });
  }

  getAutoridadByDni(dni: string): Observable<ApiResponse<AutoridadDTO>> {
    return this.http.get<ApiResponse<AutoridadDTO>>(`${this.apiUrl}/${dni}`);
  }

  createAutoridad(body: CreateAutoridadDTO): Observable<ApiResponse<AutoridadDTO>> {
    return this.http.post<ApiResponse<AutoridadDTO>>(this.apiUrl, body);
  }

  updateAutoridad(dni: string, body: UpdateAutoridadDTO): Observable<ApiResponse<AutoridadDTO>> {
    return this.http.put<ApiResponse<AutoridadDTO>>(`${this.apiUrl}/${dni}`, body);
  }

  patchAutoridad(dni: string, body: PatchAutoridadDTO): Observable<ApiResponse<AutoridadDTO>> {
    return this.http.patch<ApiResponse<AutoridadDTO>>(`${this.apiUrl}/${dni}`, body);
  }

  deleteAutoridad(dni: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${dni}`);
  }
}
