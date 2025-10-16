import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { exportCSV, exportJSON } from '../utils/export';

@Component({
  standalone: true,
  selector: 'app-backup-export',
  imports: [CommonModule],
  template: `
    <section class="p-4">
      <h2 class="mb-2">Herramientas · Export</h2>
      <p class="muted">Descargá CSV/JSON con datos visibles (mock/API).</p>
      <div class="row mt-3">
        <button (click)="downloadProductsCSV()">Exportar productos (CSV)</button>
        <button class="ml-2" (click)="downloadBackupJSON()">Backup JSON (productos + usuario)</button>
      </div>
      <p class="mt-2" *ngIf="status()">{{ status() }}</p>
    </section>
  `,
  styles: [`.row{display:flex;gap:12px}.muted{opacity:.8}`]
})
export class BackupExportComponent {
  private http = inject(HttpClient);
  status = signal('');

  downloadProductsCSV() {
    this.status.set('Exportando productos…');
    this.http.get<any[]>('/api/products', { withCredentials: true }).subscribe({
      next: (rows) => { exportCSV(rows ?? [], 'products.csv'); this.status.set('Listo ✓'); },
      error: () => { exportCSV([], 'products.csv'); this.status.set('Sin datos (mock) ✓'); }
    });
  }

  downloadBackupJSON() {
    this.status.set('Generando backup…');
    Promise.allSettled([
      this.http.get('/api/products', { withCredentials: true }).toPromise(),
      this.http.get('/api/users/me', { withCredentials: true }).toPromise()
    ]).then(([p, u]) => {
      const data = {
        products: (p as any)?.value ?? [],
        user: (u as any)?.value ?? null,
        exportedAt: new Date().toISOString()
      };
      exportJSON(data, 'backup.json'); this.status.set('Backup listo ✓');
    }).catch(() => { exportJSON({ exportedAt: new Date().toISOString() }, 'backup.json'); this.status.set('Backup básico ✓'); });
  }
}
