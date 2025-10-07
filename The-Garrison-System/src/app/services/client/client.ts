import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ClientDTO } from '../../models/client/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly apiUrl = '/api/clients';

  constructor(private http: HttpClient) {}

  getAllClients(): Observable<ApiResponse<ClientDTO[]>> {
    return this.http.get<ApiResponse<ClientDTO[]>>(this.apiUrl);
  }

  getClientByDni(dni: string): Observable<ApiResponse<ClientDTO>> {
    return this.http.get<ApiResponse<ClientDTO>>(`${this.apiUrl}/${dni}`);
  }

  createClient(c: ClientDTO): Observable<ApiResponse<ClientDTO>> {
    return this.http.post<ApiResponse<ClientDTO>>(this.apiUrl, c);
  }

  updateClient(dni: string, c: Partial<ClientDTO>): Observable<ApiResponse<ClientDTO>> {
    return this.http.patch<ApiResponse<ClientDTO>>(`${this.apiUrl}/${dni}`, c);
  }


  deleteClient(dni: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dni}`);
  }
}