import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, RoleRequestDTO, CreateRoleRequestDTO, ReviewRoleRequestDTO } from '../../models/role-request/role-request.model';

@Injectable({ providedIn: 'root' })
export class RoleRequestService {
  private readonly apiUrl = '/api/role-requests';

  constructor(private http: HttpClient) {}

  create(payload: CreateRoleRequestDTO): Observable<ApiResponse<RoleRequestDTO>> {
    return this.http.post<ApiResponse<RoleRequestDTO>>(this.apiUrl, payload);
  }

  myRequests(): Observable<ApiResponse<RoleRequestDTO[]>> {
    return this.http.get<ApiResponse<RoleRequestDTO[]>>(`${this.apiUrl}/me`);
  }

  pending(): Observable<ApiResponse<RoleRequestDTO[]>> {
    return this.http.get<ApiResponse<RoleRequestDTO[]>>(`${this.apiUrl}/pending`);
  }

  review(id: string, payload: ReviewRoleRequestDTO): Observable<ApiResponse<RoleRequestDTO>> {
    return this.http.put<ApiResponse<RoleRequestDTO>>(`${this.apiUrl}/${id}/review`, payload);
  }
}
