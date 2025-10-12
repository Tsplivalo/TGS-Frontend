import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse, DistributorDTO, CreateDistributorDTO, PatchDistributorDTO } from '../../models/distributor/distributor.model';

@Injectable({ providedIn: 'root' })
export class DistributorService {
  private readonly apiUrl = '/api/distributors';

  constructor(private http: HttpClient) {}

  // ------- Normalizaciones -------
  private normalizeOne = (raw: any): DistributorDTO => {
    if (!raw) return { dni: '', name: '', phone: '', email: '' };

    const dni = String(raw.dni ?? raw.DNI ?? '');
    const name = String(raw.name ?? raw.nombre ?? '');
    const phone = String(raw.phone ?? raw.telefono ?? '');
    const email = String(raw.email ?? '');
    const address = raw.address ?? raw.direccion ?? '';

    // zona (puede venir como objeto o solo id)
    const zoneObj = raw.zone ?? raw.zona ?? null;
    const zoneId = Number(zoneObj?.id ?? raw.zoneId ?? raw.zonaId ?? NaN);
    const zone = zoneObj
      ? { id: Number((zoneObj.id ?? zoneId) || 0), name: String(zoneObj.name ?? zoneObj.nombre ?? '') }
      : zoneId && !Number.isNaN(zoneId)
      ? { id: zoneId, name: '' }
      : null;

    // productos (array o "Information not available"…)
    const productsArr: any[] = Array.isArray(raw.products) ? raw.products : [];
    const products = productsArr.map((p) => ({
      id: Number(p.id ?? 0),
      description: String(p.description ?? p.descripcion ?? ''),
    }));

    return { dni, name, phone, email, address, zoneId: zone?.id ?? null, zone, products };
  };

  private normalizeMany = (raw: any): DistributorDTO[] => {
    const arr: any[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : [];
    return arr.map(this.normalizeOne);
  };

  // ------- CRUD -------
  getAll(): Observable<DistributorDTO[]> {
    return this.http.get<ApiResponse<DistributorDTO[]>>(this.apiUrl)
      .pipe(map((res: any) => this.normalizeMany(res)));
  }

  getOne(dni: string): Observable<DistributorDTO> {
    return this.http.get<ApiResponse<DistributorDTO>>(`${this.apiUrl}/${encodeURIComponent(dni)}`)
      .pipe(map((res: any) => this.normalizeOne(res?.data ?? res)));
  }

  create(body: CreateDistributorDTO): Observable<DistributorDTO> {
    return this.http.post<ApiResponse<DistributorDTO>>(this.apiUrl, body)
      .pipe(map((res: any) => this.normalizeOne(res?.data ?? res)));
  }

  update(dni: string, patch: PatchDistributorDTO): Observable<DistributorDTO> {
    // el back expone PATCH /:dni
    return this.http.patch<ApiResponse<DistributorDTO>>(`${this.apiUrl}/${encodeURIComponent(dni)}`, patch)
      .pipe(map((res: any) => this.normalizeOne(res?.data ?? res)));
  }

  delete(dni: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${encodeURIComponent(dni)}`);
  }
}
