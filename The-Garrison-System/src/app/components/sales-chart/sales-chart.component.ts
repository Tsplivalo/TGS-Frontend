// src/app/components/sales-chart/sales-chart.component.ts
import { Component, OnInit } from '@angular/core';
import { SalesService, ChartData } from '../../services/sales/sales.service';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-sales-chart',
  standalone: true,
  imports: [],
  templateUrl: './sales-chart.component.html',
  styleUrls: ['./sales-chart.component.scss']
})
export class SalesChartComponent implements OnInit {
  
  constructor(private salesService: SalesService) {
    // Registrar todos los componentes de Chart.js
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.salesService.getSalesSummary().subscribe({
      next: (chartData) => {
        this.createChart(chartData);
      },
      error: (err) => {
        console.error('Error fetching sales summary:', err);
        // Aquí podrías manejar el error en la UI
      }
    });
  }

  private createChart(data: ChartData): void {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }
    
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Ingresos por Día',
          data: data.data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Evolución de Ventas'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
