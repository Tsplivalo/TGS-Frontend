// src/app/services/sales/sales.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Interfaz para la estructura de datos del gráfico
export interface ChartData {
  labels: string[];
  data: number[];
}

// Interfaz para la respuesta completa de la API
export interface SalesSummaryResponse {
  status: string;
  message: string;
  data: ChartData;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = '/api/sales/summary'; // URL del endpoint

  constructor(private http: HttpClient) { }

  /**
   * Obtiene el resumen de ventas del backend.
   * Usamos el operador `map` de RxJS para transformar la respuesta
   * y devolver directamente el objeto `data` que necesita el gráfico.
   */
  getSalesSummary(): Observable<ChartData> {
    return this.http.get<SalesSummaryResponse>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }
}
