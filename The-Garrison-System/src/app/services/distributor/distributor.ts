import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  ApiResponse,
  DistributorDTO,
  CreateDistributorDTO,
  PatchDistributorDTO
} from '../../models/distributor/distributor.model';

@Injectable({ providedIn: 'root' })
export class DistributorService {
  private readonly apiUrl = '/api/distributors';

  constructor(private http: HttpClient) {}

  private normalizeOne = (raw: any): DistributorDTO => {
    if (!raw) return { dni: '', name: '', phone: '', email: '' } as any;

    const dni = String(raw.dni ?? raw.DNI ?? '');
    const zoneId = raw.zoneId != null ? Number(raw.zoneId) : null;
    const zone = raw.zone ?? (zoneId ? { id: zoneId, name: raw.zoneName ?? '' } : null);
    const products = Array.isArray(raw.products)
      ? raw.products.map((p: any) => ({ id: Number(p.id), description: String(p.description ?? '') }))
      : undefined;

    return {
      dni,
      name: String(raw.name ?? ''),
      phone: String(raw.phone ?? ''),
      email: String(raw.email ?? ''),
      address: raw.address ?? '',
      zoneId,
      zone,
      products
    };
  };

  list(): Observable<DistributorDTO[]> {
    return this.http.get<ApiResponse<DistributorDTO[]>>(this.apiUrl).pipe(
      map((res: any) => {
        const data = (res?.data ?? res) as any[];
        return data.map(this.normalizeOne);
      })
    );
  }

  get(dni: string): Observable<DistributorDTO> {
    return this.http.get<ApiResponse<DistributorDTO>>(`${this.apiUrl}/${encodeURIComponent(dni)}`).pipe(
      map((res: any) => this.normalizeOne(res?.data ?? res))
    );
  }

  create(payload: CreateDistributorDTO): Observable<DistributorDTO> {
    const body: any = { ...payload };
    body.zoneId = Number(body.zoneId);
    if (Array.isArray(body.productsIds)) {
      body.productsIds = body.productsIds.map((id: any) => Number(id)).filter((n: any) => Number.isFinite(n));
    }
    return this.http.post<ApiResponse<DistributorDTO>>(this.apiUrl, body).pipe(
      map((res: any) => this.normalizeOne(res?.data ?? res))
    );
  }

  update(dni: string, patch: PatchDistributorDTO): Observable<DistributorDTO> {
    const body: any = { ...patch };
    if (body.zoneId != null) body.zoneId = Number(body.zoneId);
    if (Array.isArray(body.productsIds)) {
      body.productsIds = body.productsIds.map((id: any) => Number(id)).filter((n: any) => Number.isFinite(n));
    }
    return this.http.patch<ApiResponse<DistributorDTO>>(`${this.apiUrl}/${encodeURIComponent(dni)}`, body).pipe(
      map((res: any) => this.normalizeOne(res?.data ?? res))
    );
  }

  delete(dni: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${encodeURIComponent(dni)}`);
  }
}
