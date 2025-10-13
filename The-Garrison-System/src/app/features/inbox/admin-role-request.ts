import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoleRequestService } from '../../services/role-request/role-request';
import { RoleRequest } from '../../models/role-request/role-request.model';

@Component({
  selector: 'app-admin-role-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
  <section class="max-w-5xl mx-auto p-4">
    <header class="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
      <h1 class="text-2xl font-semibold">Solicitudes de rol</h1>
      <div class="flex-1"></div>
      <div class="flex gap-2 items-center">
        <select class="input" [(ngModel)]="statusFilter" (ngModelChange)="reload()">
          <option value="PENDING">Pendientes</option>
          <option value="APPROVED">Aprobadas</option>
          <option value="REJECTED">Rechazadas</option>
        </select>
        <input class="input" placeholder="Buscar..." [(ngModel)]="q" (keyup.enter)="reload()" />
        <button class="btn" (click)="reload()">Buscar</button>
      </div>
    </header>

    <div class="overflow-auto border rounded-lg">
      <table class="min-w-[800px] w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="th">Usuario</th>
            <th class="th">Email</th>
            <th class="th">Rol solicitado</th>
            <th class="th">Motivo</th>
            <th class="th">Creado</th>
            <th class="th">Estado</th>
            <th class="th text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of items()" class="border-t">
            <td class="td">{{ r.user }}</td>
            <td class="td">{{ r.reviewedBy }}</td>
            <td class="td">{{ r.requestedRole }}</td>
            <td class="td max-w-[260px] truncate" [title]="r.reason || ''">{{ r.reason || '—' }}</td>
            <td class="td">{{ r.createdAt | date:'short' }}</td>
            <td class="td">
              <span class="badge" [class.badge-pending]="r.status==='PENDING'" [class.badge-ok]="r.status==='APPROVED'" [class.badge-bad]="r.status==='REJECTED'">{{ r.status }}</span>
            </td>
            <td class="td text-right">
              <ng-container [ngSwitch]="r.status">
                <div *ngSwitchCase="'PENDING'" class="inline-flex gap-2">
                  <button class="btn-ok" (click)="approve(r)">Aprobar</button>
                  <button class="btn-bad" (click)="reject(r)">Rechazar</button>
                </div>
                <span *ngSwitchDefault class="text-gray-500">—</span>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="flex items-center justify-between mt-4">
      <div class="text-sm text-gray-500">Total: {{ total() }}</div>
      <div class="inline-flex gap-2">
        <button class="btn" [disabled]="page()<=1" (click)="prev()">Anterior</button>
        <span class="px-2">Página {{ page() }}</span>
        <button class="btn" [disabled]="page()*pageSize()>=total()" (click)="next()">Siguiente</button>
      </div>
    </footer>
  </section>
  `,
  styles: [`
    .input{border:1px solid #ddd;padding:.5rem;border-radius:.5rem}
    .btn{border:1px solid #ddd;padding:.4rem .7rem;border-radius:.5rem;background:#fff}
    .btn-ok{background:#10b981;color:#fff;padding:.35rem .6rem;border-radius:.5rem}
    .btn-bad{background:#ef4444;color:#fff;padding:.35rem .6rem;border-radius:.5rem}
    .th{ text-align:left; padding:.6rem .75rem; font-weight:600 }
    .td{ padding:.6rem .75rem }
    .badge{ padding:.15rem .5rem; border-radius:9999px; font-weight:600; font-size:.75rem }
    .badge-pending{ background:#fef3c7; color:#92400e }
    .badge-ok{ background:#d1fae5; color:#065f46 }
    .badge-bad{ background:#fee2e2; color:#991b1b }
  `]
})
export class AdminRoleRequestsComponent implements OnInit {
  private api = inject(RoleRequestService);

  statusFilter = 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED';
  q = '';
  page = signal(1);
  pageSize = signal(10);
  total = signal(0);
  items = signal<RoleRequest[]>([]);

  ngOnInit(): void { this.reload(); }

  reload() {
    this.api.list({ status: this.statusFilter, q: this.q, page: this.page(), pageSize: this.pageSize() })
      .subscribe(res => { this.items.set(res.items); this.total.set(res.total); });
  }

  next(){ if (this.page()*this.pageSize() < this.total()) { this.page.update(p=>p+1); this.reload(); } }
  prev(){ if (this.page()>1) { this.page.update(p=>p-1); this.reload(); } }

  approve(r: RoleRequest){
    if (!confirm(`Aprobar solicitud de ${r.user} a rol ${r.requestedRole}?`)) return;
    this.api.approve(r.id, 'Aprobado desde bandeja').subscribe(updated => {
      this.items.update(list => list.map(x => x.id===updated.id ? updated : x));
    });
  }

  reject(r: RoleRequest){
    const reason = prompt('Motivo de rechazo:');
    if (reason==null || reason.trim()==='') return;
    this.api.reject(r.id, reason).subscribe(updated => {
      this.items.update(list => list.map(x => x.id===updated.id ? updated : x));
    });
  }
}