import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoleRequest } from '../../models/role-request/role-request.model';
import { RoleRequestService } from '../../services/role-request/role-request';

@Component({
  selector: 'app-client-inbox',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <section class="max-w-3xl mx-auto p-4">
    <header class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Mi bandeja</h1>
      <a routerLink="/role-request/new" class="btn">Nueva solicitud</a>
    </header>

    <ng-container *ngIf="items().length; else empty">
      <div class="grid gap-3">
        <article *ngFor="let r of items()" class="card">
          <header class="flex items-center justify-between">
            <div>
              <div class="font-semibold">Solicitud de rol: {{ r.requestedRole }}</div>
              <div class="text-sm text-gray-500">Creada: {{ r.createdAt | date:'short' }}</div>
            </div>
            <span class="badge"
                  [class.badge-pending]="r.status==='PENDING'"
                  [class.badge-ok]="r.status==='APPROVED'"
                  [class.badge-bad]="r.status==='REJECTED'">
              {{ r.status }}
            </span>
          </header>

          <p class="mt-2 text-sm" *ngIf="r.reason">Motivo: {{ r.reason }}</p>
          <p class="mt-1 text-sm text-gray-600"
             *ngIf="r.status==='REJECTED' && r.reason">
            Motivo de rechazo: {{ r.reason }}
          </p>
          <footer class="mt-2 text-xs text-gray-500" *ngIf="r.decidedAt">
            Decidida: {{ r.decidedAt | date:'short' }}
          </footer>
        </article>
      </div>
    </ng-container>

    <ng-template #empty>
      <div class="empty">
        <p>No tenés solicitudes todavía.</p>
        <a routerLink="/role-request/new" class="btn">Crear solicitud</a>
      </div>
    </ng-template>
  </section>
  `,
  styles: [`
    .btn{border:1px solid #ddd;padding:.45rem .8rem;border-radius:.5rem;background:#fff}
    .card{border:1px solid #e5e7eb;border-radius:.75rem;padding:1rem;background:#fff}
    .badge{ padding:.2rem .6rem; border-radius:9999px; font-weight:600; font-size:.75rem }
    .badge-pending{ background:#fef3c7; color:#92400e }
    .badge-ok{ background:#d1fae5; color:#065f46 }
    .badge-bad{ background:#fee2e2; color:#991b1b }
    .empty{ border:1px dashed #e5e7eb; border-radius:.75rem; padding:1.25rem; text-align:center; background:#fafafa }
  `]
})
export class ClientInboxComponent implements OnInit {
  private api = inject(RoleRequestService);
  items = signal<RoleRequest[]>([]);

  ngOnInit(): void {
    this.api.listMine().subscribe(list => {
      // Orden descendente por fecha (tolera string ISO o Date)
      const toTime = (d: string | Date | undefined) =>
        d ? new Date(d as any).getTime() : 0;
      this.items.set([...list].sort((a,b) => toTime(b.createdAt) - toTime(a.createdAt)));
    });
  }
}
