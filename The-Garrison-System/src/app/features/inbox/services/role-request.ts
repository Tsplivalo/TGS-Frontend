import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  RoleRequest,
  CreateRoleRequestDTO,
  ReviewRoleRequestDTO,
  RoleRequestSearchParams,
  PaginatedRoleRequests,
} from '../models/role-request.model';

@Injectable({
  providedIn: 'root'
})
export class RoleRequestService {
  private readonly baseUrl = 'http://localhost:3000/api/role-requests';

  constructor(private http: HttpClient) {}

  async createRequest(data: CreateRoleRequestDTO): Promise<RoleRequest> {
    const response = await firstValueFrom(
      this.http.post<{ data: RoleRequest }>(this.baseUrl, data)
    );
    return response.data;
  }

  async getMyRequests(): Promise<RoleRequest[]> {
    const response = await firstValueFrom(
      this.http.get<{ data: RoleRequest[] }>(`${this.baseUrl}/me`)
    );
    return response.data;
  }

  async getPendingRequests(): Promise<RoleRequest[]> {
    const response = await firstValueFrom(
      this.http.get<{ data: RoleRequest[] }>(`${this.baseUrl}/pending`)
    );
    return response.data;
  }

  async searchRequests(params: RoleRequestSearchParams): Promise<PaginatedRoleRequests> {
    let httpParams = new HttpParams();

    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.requestedRole) httpParams = httpParams.set('requestedRole', params.requestedRole);
    if (params.userId) httpParams = httpParams.set('userId', params.userId);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return await firstValueFrom(
      this.http.get<PaginatedRoleRequests>(this.baseUrl, { params: httpParams })
    );
  }

  async reviewRequest(requestId: string, data: ReviewRoleRequestDTO): Promise<RoleRequest> {
    const response = await firstValueFrom(
      this.http.put<{ data: RoleRequest }>(
        `${this.baseUrl}/${requestId}/review`,
        data
      )
    );
    return response.data;
  }
}