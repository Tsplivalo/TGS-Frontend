// src/app/services/client/client.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ApiResponse, 
  ClientDTO, 
  CreateClientDTO, 
  UpdateClientDTO,
  CreateClientResponse 
} from '../../models/client/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly apiUrl = '/api/clients';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los clientes con paginación opcional
   */
  getAllClients(page?: number, limit?: number): Observable<ApiResponse<ClientDTO[]>> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());
    
    return this.http.get<ApiResponse<ClientDTO[]>>(this.apiUrl, { 
      params,
      withCredentials: true 
    });
  }

  /**
   * Busca clientes por nombre
   */
  searchClients(query: string, page?: number, limit?: number): Observable<ApiResponse<ClientDTO[]>> {
    let params = new HttpParams().set('q', query);
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());

    return this.http.get<ApiResponse<ClientDTO[]>>(`${this.apiUrl}/search`, { 
      params,
      withCredentials: true 
    });
  }

  /**
   * Obtiene un cliente por DNI
   */
  getClientByDni(dni: string): Observable<ApiResponse<ClientDTO>> {
    return this.http.get<ApiResponse<ClientDTO>>(
      `${this.apiUrl}/${dni}`, 
      { withCredentials: true }
    );
  }

  /**
   * Crea un nuevo cliente (opcionalmente con usuario)
   */
  createClient(data: CreateClientDTO): Observable<ApiResponse<CreateClientResponse>> {
    return this.http.post<ApiResponse<CreateClientResponse>>(
      this.apiUrl, 
      data, 
      { withCredentials: true }
    );
  }

  /**
   * Actualiza un cliente existente (PATCH - parcial)
   */
  updateClient(dni: string, data: UpdateClientDTO): Observable<ApiResponse<ClientDTO>> {
    return this.http.patch<ApiResponse<ClientDTO>>(
      `${this.apiUrl}/${dni}`, 
      data, 
      { withCredentials: true }
    );
  }

  /**
   * Elimina un cliente por DNI
   */
  deleteClient(dni: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${dni}`, 
      { withCredentials: true }
    );
  }
}