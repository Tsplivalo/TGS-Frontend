import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../../models/cliente/cliente.model';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private apiUrl = 'http://localhost:3000/clientes'; // URL de tu backend

  constructor(private http: HttpClient) {}

  // Obtener todos los clientes
  getAllClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  // Obtener un cliente por DNI
  getClienteByDni(dni: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${dni}`);
  }

  // Crear nuevo cliente
  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  // Actualizar cliente (PUT)
  updateCliente(dni: string, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${dni}`, cliente);
  }

  // Actualizar parcialmente cliente (PATCH)
  patchCliente(dni: string, cambios: Partial<Cliente>): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.apiUrl}/${dni}`, cambios);
  }

  // Eliminar cliente
  deleteCliente(dni: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${dni}`);
  }
}
