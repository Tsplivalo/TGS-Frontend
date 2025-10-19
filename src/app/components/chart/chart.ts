// src/app/components/chart/chart.component.ts

import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container" [style.height]="height">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      width: 100%;
    }

    canvas {
      display: block;
      max-width: 100%;
    }
  `]
})
export class ChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() type: ChartType = 'bar';
  @Input() data!: ChartConfiguration['data'];
  @Input() options?: ChartConfiguration['options'];
  @Input() height: string = '400px';

  private chart?: Chart;

  ngOnInit(): void {
    // Opciones por defecto con el tema oscuro de tu app
    this.options = {
      ...this.getDefaultOptions(),
      ...this.options
    };
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['data'] || changes['options'])) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private createChart(): void {
    if (!this.chartCanvas?.nativeElement) {
      console.error('Canvas element not found');
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    try {
      this.chart = new Chart(ctx, {
        type: this.type,
        data: this.data,
        options: this.options
      });
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }

  private updateChart(): void {
    if (!this.chart) return;

    this.chart.data = this.data;
    if (this.options) {
      this.chart.options = this.options;
    }
    this.chart.update();
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private getDefaultOptions(): ChartConfiguration['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#e5e7eb',
            font: {
              family: "'Google Sans Code', 'Montserrat', sans-serif",
              size: 12,
              weight: 'bold' // ✅ Cambiado de '600' a 'bold'
            },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(20, 22, 28, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#e5e7eb',
          borderColor: 'rgba(195, 164, 98, 0.3)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            family: "'Google Sans Code', sans-serif",
            size: 14,
            weight: 'bold' // ✅ Cambiado de '700' a 'bold'
          },
          bodyFont: {
            family: "'Google Sans Code', sans-serif",
            size: 12,
            weight: 'bold' // ✅ Cambiado de '600' a 'bold'
          }
        }
      },
      scales: this.type !== 'pie' && this.type !== 'doughnut' ? {
        x: {
          border: {
            display: false
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.06)'
          },
          ticks: {
            color: '#9ca3af',
            font: {
              family: "'Google Sans Code', sans-serif",
              size: 11,
              weight: 'bold'
            }
          }
        },
        y: {
          border: {
            display: false
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.06)'
          },
          ticks: {
            color: '#9ca3af',
            font: {
              family: "'Google Sans Code', sans-serif",
              size: 11,
              weight: 'bold'
            }
          },
          beginAtZero: true
        }
      } : undefined
    };
  }
}