import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ClandestineAgreementDTO, CreateClandestineAgreementDTO, PatchClandestineAgreementDTO } from '../../models/clandestine-agreement/clandestine-agreement.model';

@Injectable({ providedIn: 'root' })
export class ClandestineAgreementService {
  private readonly apiUrl = '/api/clandestine-agreements';

  constructor(private http: HttpClient) {}

  search(q?: string): Observable<ApiResponse<ClandestineAgreementDTO[]>> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ApiResponse<ClandestineAgreementDTO[]>>(`${this.apiUrl}/search`, { params });
  }

  list(): Observable<ApiResponse<ClandestineAgreementDTO[]>> {
    return this.http.get<ApiResponse<ClandestineAgreementDTO[]>>(this.apiUrl);
  }

  get(id: number): Observable<ApiResponse<ClandestineAgreementDTO>> {
    return this.http.get<ApiResponse<ClandestineAgreementDTO>>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateClandestineAgreementDTO): Observable<ApiResponse<ClandestineAgreementDTO>> {
    return this.http.post<ApiResponse<ClandestineAgreementDTO>>(this.apiUrl, payload);
  }

  update(id: number, payload: PatchClandestineAgreementDTO): Observable<ApiResponse<ClandestineAgreementDTO>> {
    return this.http.patch<ApiResponse<ClandestineAgreementDTO>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
