import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ClienteDTO } from '../../models/cliente/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly apiUrl = '/api/clientes';

  constructor(private http: HttpClient) {}

  getAllClientes(): Observable<ApiResponse<ClienteDTO[]>> {
    return this.http.get<ApiResponse<ClienteDTO[]>>(this.apiUrl);
  }

  getClienteByDni(dni: string): Observable<ApiResponse<ClienteDTO>> {
    return this.http.get<ApiResponse<ClienteDTO>>(`${this.apiUrl}/${dni}`);
  }

  createCliente(c: ClienteDTO): Observable<ApiResponse<ClienteDTO>> {
    return this.http.post<ApiResponse<ClienteDTO>>(this.apiUrl, c);
  }

  updateCliente(dni: string, c: Partial<ClienteDTO>): Observable<ApiResponse<ClienteDTO>> {
    return this.http.patch<ApiResponse<ClienteDTO>>(`${this.apiUrl}/${dni}`, c);
  }


  deleteCliente(dni: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dni}`);
  }
}
