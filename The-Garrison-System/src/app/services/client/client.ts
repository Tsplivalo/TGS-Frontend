import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse, ClientDTO } from '../../models/client/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly apiUrl = '/api/clients';

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<ClientDTO[]> {
    return this.http.get<ApiResponse<ClientDTO[]>>(this.apiUrl).pipe(
      map((res) => (res as any)?.data ?? (res as any))
    );
  }

  getClientByDni(dni: string): Observable<ClientDTO> {
    return this.http.get<ApiResponse<ClientDTO>>(`${this.apiUrl}/${encodeURIComponent(dni)}`).pipe(
      map((res) => (res as any)?.data ?? (res as any))
    );
  }

  createClient(c: ClientDTO): Observable<ClientDTO> {
    return this.http.post<ApiResponse<ClientDTO>>(this.apiUrl, c).pipe(
      map((res) => (res as any)?.data ?? (res as any))
    );
  }

  updateClient(dni: string, c: Partial<ClientDTO>): Observable<ClientDTO> {
    return this.http.patch<ApiResponse<ClientDTO>>(`${this.apiUrl}/${encodeURIComponent(dni)}`, c).pipe(
      map((res) => (res as any)?.data ?? (res as any))
    );
  }

  deleteClient(dni: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${encodeURIComponent(dni)}`);
  }
}
