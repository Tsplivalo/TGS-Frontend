import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RoleRequestService } from '../../services/role-request/role-request';
import { RoleRequest } from '../../models/role-request/role-request.model';

@Component({
  selector: 'app-admin-role-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-role-request.html',
  styleUrls: ['./admin-role-request.scss'],
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
    this.api.list({
      status: this.statusFilter,
      q: this.q,
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe(res => {
      this.items.set(res.items);
      this.total.set(res.total);
    });
  }

  next() { if (this.page() * this.pageSize() < this.total()) { this.page.update(p => p + 1); this.reload(); } }
  prev() { if (this.page() > 1) { this.page.update(p => p - 1); this.reload(); } }

  approve(r: RoleRequest) {
    if (!confirm(`Aprobar solicitud de ${r.user} a rol ${r.requestedRole}?`)) return;
    this.api.approve(r.id, 'Aprobado desde bandeja').subscribe(updated => {
      this.items.update(list => list.map(x => x.id === updated.id ? updated : x));
    });
  }

  reject(r: RoleRequest) {
    const reason = prompt('Motivo de rechazo:');
    if (reason == null || reason.trim() === '') return;
    this.api.reject(r.id, reason).subscribe(updated => {
      this.items.update(list => list.map(x => x.id === updated.id ? updated : x));
    });
  }
}
