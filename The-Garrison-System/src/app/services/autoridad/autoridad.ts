import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  AutoridadDTO,
  CreateAutoridadDTO,
  UpdateAutoridadDTO,
  PartialUpdateAutoridadDTO
} from '../../models/autoridad/autoridad.model';

@Injectable({ providedIn: 'root' })
export class AutoridadService {
  private readonly apiUrl = '/api/autoridades';

  constructor(private http: HttpClient) {}

  getAllAutoridades(): Observable<ApiResponse<AutoridadDTO[]>> {
    return this.http.get<ApiResponse<AutoridadDTO[]>>(this.apiUrl);
  }

  getAutoridadByDni(dni: string): Observable<ApiResponse<AutoridadDTO>> {
    return this.http.get<ApiResponse<AutoridadDTO>>(`${this.apiUrl}/${dni}`);
  }

  createAutoridad(a: CreateAutoridadDTO): Observable<ApiResponse<AutoridadDTO>> {
    return this.http.post<ApiResponse<AutoridadDTO>>(this.apiUrl, a);
  }

  updateAutoridad(
    dni: string,
    a: UpdateAutoridadDTO
  ): Observable<ApiResponse<AutoridadDTO>> {
    return this.http.put<ApiResponse<AutoridadDTO>>(
      `${this.apiUrl}/${dni}`,
      a
    );
  }

  patchAutoridad(
    dni: string,
    a: PartialUpdateAutoridadDTO
  ): Observable<ApiResponse<AutoridadDTO>> {
    return this.http.patch<ApiResponse<AutoridadDTO>>(
      `${this.apiUrl}/${dni}`,
      a
    );
  }

  deleteAutoridad(dni: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dni}`);
  }
}
