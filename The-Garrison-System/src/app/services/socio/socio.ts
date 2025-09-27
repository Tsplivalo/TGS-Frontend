import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Socio, SocioStatus, ListResponse, ItemResponse } from '../models/socio.model';
import { API_BASE_URL } from '@/app/config/tokens'; // ya lo tenés provisto como '/api'

@Injectable({ providedIn: 'root' })
export class SocioService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL); // '/api'

  list(q?: string) {
    let params = new HttpParams();
    if (q?.trim()) params = params.set('q', q.trim());
    return firstValueFrom(this.http.get<ListResponse<Socio>>(${this.base}/socios, { params }));
  }

  getById(id: number) {
    return firstValueFrom(this.http.get<ItemResponse<Socio>>(${this.base}/socios/${id}));
  }

  create(payload: Omit<Socio, 'id'>) {
    return firstValueFrom(this.http.post<ItemResponse<Socio>>(${this.base}/socios, payload));
  }

  update(id: number, payload: Partial<Omit<Socio, 'id'>>) {
    return firstValueFrom(this.http.patch<ItemResponse<Socio>>(${this.base}/socios/${id}, payload));
  }

  patchStatus(id: number, status: SocioStatus) {
    return firstValueFrom(this.http.patch<ItemResponse<Socio>>(${this.base}/socios/${id}/status, { status }));
  }

  remove(id: number) {
    return firstValueFrom(this.http.delete<ItemResponse<null>>(${this.base}/socios/${id}));
  }
}
