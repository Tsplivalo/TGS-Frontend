import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  ZonaDTO,
  CreateZonaDTO,
  UpdateZonaDTO,
  PatchZonaDTO
} from '../../models/zona/zona.model';

@Injectable({ providedIn: 'root' })
export class ZonaService {
  private readonly apiUrl = '/api/zonas';

  constructor(private http: HttpClient) {}

  getAllZonas(): Observable<ApiResponse<ZonaDTO[]>> {
    return this.http.get<ApiResponse<ZonaDTO[]>>(this.apiUrl);
  }

  getZonaById(id: number): Observable<ApiResponse<ZonaDTO>> {
    return this.http.get<ApiResponse<ZonaDTO>>(`${this.apiUrl}/${id}`);
  }

  createZona(z: CreateZonaDTO): Observable<ApiResponse<ZonaDTO>> {
    return this.http.post<ApiResponse<ZonaDTO>>(this.apiUrl, z);
  }

  updateZona(id: number, z: UpdateZonaDTO): Observable<ApiResponse<ZonaDTO>> {
    return this.http.put<ApiResponse<ZonaDTO>>(`${this.apiUrl}/${id}`, z);
  }

  patchZona(id: number, z: PatchZonaDTO): Observable<ApiResponse<ZonaDTO>> {
    return this.http.patch<ApiResponse<ZonaDTO>>(`${this.apiUrl}/${id}`, z);
  }

  deleteZona(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}