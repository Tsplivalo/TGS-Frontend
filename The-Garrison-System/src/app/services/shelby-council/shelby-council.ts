import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ShelbyCouncilDTO, CreateShelbyCouncilDTO, PatchShelbyCouncilDTO } from '../../models/shelby-council/shelby-council.model';

@Injectable({ providedIn: 'root' })
export class ShelbyCouncilService {
  private readonly apiUrl = '/api/shelby-council';

  constructor(private http: HttpClient) {}

  search(q?: string): Observable<ApiResponse<ShelbyCouncilDTO[]>> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ApiResponse<ShelbyCouncilDTO[]>>(`${this.apiUrl}/search`, { params });
  }

  list(): Observable<ApiResponse<ShelbyCouncilDTO[]>> {
    return this.http.get<ApiResponse<ShelbyCouncilDTO[]>>(this.apiUrl);
  }

  get(id: number): Observable<ApiResponse<ShelbyCouncilDTO>> {
    return this.http.get<ApiResponse<ShelbyCouncilDTO>>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateShelbyCouncilDTO): Observable<ApiResponse<ShelbyCouncilDTO>> {
    return this.http.post<ApiResponse<ShelbyCouncilDTO>>(this.apiUrl, payload);
  }

  update(id: number, payload: PatchShelbyCouncilDTO): Observable<ApiResponse<ShelbyCouncilDTO>> {
    return this.http.patch<ApiResponse<ShelbyCouncilDTO>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
