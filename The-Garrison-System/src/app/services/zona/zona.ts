import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Zona } from '../../models/zona/zona.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZonaService {
  private apiUrl = 'http://localhost:3000/zonas'; // cambiá el puerto si usás otro

  constructor(private http: HttpClient) {}

  getAllZonas(): Observable<Zona[]> {
    return this.http.get<Zona[]>(this.apiUrl);
  }

  crearZona(zona: Zona): Observable<Zona> {
    return this.http.post<Zona>(this.apiUrl, zona);
  }

  actualizarZona(zona: Zona): Observable<Zona> {
    return this.http.put<Zona>(this.apiUrl, zona);
  }

  eliminarZona(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
