import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { ChartConfiguration } from 'chart.js';

export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  salesByMonth: {
    month: string;
    amount: number;
  }[];
  topProducts: {
    productId: number;
    productName: string;
    quantity: number;
  }[];
  salesByDistributor: {
    distributorName: string;
    totalSales: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/stats';
  
  // ⬅ NUEVO: Flag para usar datos mock
  private readonly USE_MOCK_DATA = true; // Cambia a false cuando tengas el backend listo

  /**
   * Datos mock para testing
   */
  private getMockStats(): SalesStats {
    return {
      totalSales: 247,
      totalRevenue: 1250000,
      averageTicket: 5060.73,
      salesByMonth: [
        { month: 'Enero 2025', amount: 185000 },
        { month: 'Febrero 2025', amount: 220000 },
        { month: 'Marzo 2025', amount: 198000 },
        { month: 'Abril 2025', amount: 245000 },
        { month: 'Mayo 2025', amount: 210000 },
        { month: 'Junio 2025', amount: 192000 }
      ],
      topProducts: [
        { productId: 1, productName: 'Vino Malbec Reserva', quantity: 89 },
        { productId: 2, productName: 'Champagne Brut', quantity: 67 },
        { productId: 3, productName: 'Whisky Premium', quantity: 54 },
        { productId: 4, productName: 'Vodka Importado', quantity: 42 },
        { productId: 5, productName: 'Ron Añejo', quantity: 31 }
      ],
      salesByDistributor: [
        { distributorName: 'Distribuidora Norte SA', totalSales: 385000 },
        { distributorName: 'Logística Sur SRL', totalSales: 298000 },
        { distributorName: 'Comercial Este & Oeste', totalSales: 325000 },
        { distributorName: 'Transporte Central', totalSales: 242000 }
      ]
    };
  }

  /**
   * Obtiene las estadísticas generales
   */
  getStats(): Observable<SalesStats> {
    if (this.USE_MOCK_DATA) {
      console.log('📊 Using MOCK stats data');
      return of(this.getMockStats());
    }

    return this.http.get<{ data: SalesStats }>(`${this.baseUrl}`, {
      withCredentials: true
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Convierte datos del backend a formato Chart.js para ventas por mes
   */
  getSalesChartData(): Observable<ChartConfiguration['data']> {
    return this.getStats().pipe(
      map(stats => ({
        labels: stats.salesByMonth.map(s => s.month),
        datasets: [
          {
            label: 'Ventas ($)',
            data: stats.salesByMonth.map(s => s.amount),
            backgroundColor: 'rgba(195, 164, 98, 0.8)',
            borderColor: 'rgba(195, 164, 98, 1)',
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      }))
    );
  }

  /**
   * Convierte datos del backend a formato Chart.js para productos top
   */
  getTopProductsChartData(): Observable<ChartConfiguration['data']> {
    return this.getStats().pipe(
      map(stats => ({
        labels: stats.topProducts.map(p => p.productName),
        datasets: [
          {
            label: 'Cantidad Vendida',
            data: stats.topProducts.map(p => p.quantity),
            backgroundColor: [
              'rgba(195, 164, 98, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(156, 163, 175, 0.6)'
            ],
            borderColor: [
              'rgba(195, 164, 98, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(156, 163, 175, 1)'
            ],
            borderWidth: 2,
            hoverOffset: 8
          }
        ]
      }))
    );
  }

  /**
   * Convierte datos del backend a formato Chart.js para distribuidores
   */
  getDistributorsChartData(): Observable<ChartConfiguration['data']> {
    return this.getStats().pipe(
      map(stats => ({
        labels: stats.salesByDistributor.map(d => d.distributorName),
        datasets: [
          {
            label: 'Ventas Totales ($)',
            data: stats.salesByDistributor.map(d => d.totalSales),
            backgroundColor: 'rgba(195, 164, 98, 0.8)',
            borderColor: 'rgba(195, 164, 98, 1)',
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      }))
    );
  }
}