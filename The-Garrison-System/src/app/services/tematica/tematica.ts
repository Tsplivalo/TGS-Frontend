import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  TematicaDTO,
  CreateTematicaDTO,
  UpdateTematicaDTO,
} from '../../models/tematica/tematica.model';

@Injectable({ providedIn: 'root' })
export class TematicaService {
  private readonly apiUrl = '/api/tematicas';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<TematicaDTO[]>> {
    return this.http.get<ApiResponse<TematicaDTO[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<TematicaDTO>> {
    return this.http.get<ApiResponse<TematicaDTO>>(`${this.apiUrl}/${id}`);
  }

  create(body: CreateTematicaDTO): Observable<ApiResponse<TematicaDTO>> {
    return this.http.post<ApiResponse<TematicaDTO>>(this.apiUrl, body);
  }

  update(id: number, body: UpdateTematicaDTO): Observable<ApiResponse<TematicaDTO>> {
    // el backend expone PATCH parcial
    return this.http.patch<ApiResponse<TematicaDTO>>(`${this.apiUrl}/${id}`, body);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
