import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';  
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
  

  isNombreDisponible(nombre: string, excludeId?: number): Observable<boolean> {
    const lower = (nombre ?? '').trim().toLowerCase();
    return this.getAllZonas().pipe(
      map(resp => {
        const data = resp?.data ?? [];
        return !data.some(z =>
          (z.nombre ?? '').trim().toLowerCase() === lower &&
          (excludeId ? z.id !== excludeId : true)
        );
      }),
      catchError(() => of(true)) 
    );
  }


  createZonaValidated(z: CreateZonaDTO): Observable<ApiResponse<ZonaDTO>> {
    const nombre = (z.nombre ?? '').trim();
    if (!nombre) {
      return throwError(() => new Error('El nombre es requerido.'));
    }
    return this.isNombreDisponible(nombre).pipe(
      switchMap(isFree => {
        if (!isFree) {
          return throwError(() => new Error('Ya existe una zona con ese nombre (sin importar mayúsculas/minúsculas).'));
        }
        return this.createZona({ ...z, nombre });
      })
    );
  }

  updateZonaValidated(id: number, z: UpdateZonaDTO): Observable<ApiResponse<ZonaDTO>> {
    const nombre = (z.nombre ?? '').trim();
    // Solo valido si mandan nombre (update parcial puede no tocarlo)
    if (!z.nombre) {
      return this.updateZona(id, z);
    }
    if (!nombre) {
      return throwError(() => new Error('El nombre no puede ser vacío.'));
    }
    return this.isNombreDisponible(nombre, id).pipe(
      switchMap(isFree => {
        if (!isFree) {
          return throwError(() => new Error('Ya existe una zona con ese nombre (sin importar mayúsculas/minúsculas).'));
        }
        return this.updateZona(id, { ...z, nombre });
      })
    );
  }
}
