import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-kpi-cards',
  imports: [CommonModule],
  template: `
    <section class="grid">
      <div class="card"><h3>Ventas (mes)</h3><b>{{ kpis().sales }}</b></div>
      <div class="card"><h3>Clientes</h3><b>{{ kpis().clients }}</b></div>
      <div class="card"><h3>Ticket prom.</h3><b>{{ kpis().avgTicket | number:'1.0-0' }}</b></div>
    </section>
  `,
  styles:[`
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    .card{padding:12px;border-radius:12px;border:1px solid #ddd;background:#fff}
    h3{margin:0 0 6px 0;font-weight:600}
    b{font-size:22px}
  `]
})
export class KpiCardsComponent {
  private http = inject(HttpClient);
  private data = signal({ sales: 0, clients: 0, avgTicket: 0 });

  constructor(){
    this.http.get<any>('/api/kpis', { withCredentials: true }).subscribe({
      next: (d) => this.data.set(d ?? { sales: 24, clients: 8, avgTicket: 187 }),
      error: () => this.data.set({ sales: 24, clients: 8, avgTicket: 187 }) // mock
    });
  }
  kpis = computed(() => this.data());
}
