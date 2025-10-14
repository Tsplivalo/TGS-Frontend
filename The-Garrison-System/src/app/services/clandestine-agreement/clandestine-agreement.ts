import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  ApiResponse,
  ClandestineAgreementDTO,
  CreateClandestineAgreementDTO,
  PatchClandestineAgreementDTO
} from '../../models/clandestine-agreement/clandestine-agreement.model';

@Injectable({ providedIn: 'root' })
export class ClandestineAgreementService {
  private readonly apiUrl = '/api/clandestine-agreements';

  constructor(private http: HttpClient) {}

  search(q?: string): Observable<ClandestineAgreementDTO[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ApiResponse<ClandestineAgreementDTO[]>>(`${this.apiUrl}/search`, { params }).pipe(
      map((res: any) => (res?.data ?? res) as ClandestineAgreementDTO[])
    );
  }

  list(): Observable<ClandestineAgreementDTO[]> {
    return this.http.get<ApiResponse<ClandestineAgreementDTO[]>>(this.apiUrl).pipe(
      map((res: any) => (res?.data ?? res) as ClandestineAgreementDTO[])
    );
  }

  get(id: number): Observable<ClandestineAgreementDTO> {
    return this.http.get<ApiResponse<ClandestineAgreementDTO>>(`${this.apiUrl}/${id}`).pipe(
      map((res: any) => (res?.data ?? res) as ClandestineAgreementDTO)
    );
  }

  create(payload: CreateClandestineAgreementDTO): Observable<ClandestineAgreementDTO> {
    const body: any = { ...payload };
    body.shelbyCouncilId = Number(body.shelbyCouncilId);
    body.authorityDni = String(body.authorityDni);
    return this.http.post<ApiResponse<ClandestineAgreementDTO>>(this.apiUrl, body).pipe(
      map((res: any) => (res?.data ?? res) as ClandestineAgreementDTO)
    );
  }

  update(id: number, payload: PatchClandestineAgreementDTO): Observable<ClandestineAgreementDTO> {
    const body: any = { ...payload };
    if (body.shelbyCouncilId != null) body.shelbyCouncilId = Number(body.shelbyCouncilId);
    if (body.authorityDni != null) body.authorityDni = String(body.authorityDni);
    return this.http.patch<ApiResponse<ClandestineAgreementDTO>>(`${this.apiUrl}/${id}`, body).pipe(
      map((res: any) => (res?.data ?? res) as ClandestineAgreementDTO)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
