import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ApiResponse,
  SobornoPendienteDTO,
  CreateSobornoDTO,
  UpdateSobornoDTO
} from '../../models/soborno/soborno.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SobornoService {
  private readonly apiUrl = '/api/sobornosPendientes';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<SobornoPendienteDTO[]>> {
    return this.http.get<ApiResponse<SobornoPendienteDTO[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<SobornoPendienteDTO>> {
    return this.http.get<ApiResponse<SobornoPendienteDTO>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateSobornoDTO): Observable<ApiResponse<SobornoPendienteDTO>> {
    return this.http.post<ApiResponse<SobornoPendienteDTO>>(this.apiUrl, dto);
  }

  update(id: number, dto: CreateSobornoDTO): Observable<ApiResponse<SobornoPendienteDTO>> {
    return this.http.put<ApiResponse<SobornoPendienteDTO>>(`${this.apiUrl}/${id}`, dto);
  }

  patch(id: number, dto: UpdateSobornoDTO): Observable<ApiResponse<SobornoPendienteDTO>> {
    return this.http.patch<ApiResponse<SobornoPendienteDTO>>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
