import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RoleRequestService } from '../../services/role-request/role-request';
import { RoleRequest, CreateRoleRequestDTO } from '../../models/role-request/role-request.model';
import { AuthService } from '../../services/auth/auth';

@Component({
  selector: 'app-role-request',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './role-request.html',
  styleUrls: ['./role-request.scss'],
})
export class RoleRequestComponent implements OnInit {
  private fb   = inject(FormBuilder);
  private srv  = inject(RoleRequestService);
  private auth = inject(AuthService);

  // Estado
  my      = signal<RoleRequest[]>([]);
  pending = signal<RoleRequest[]>([]);
  isAdmin = signal(false);
  loading = signal(false);
  error   = signal<string | null>(null);

  // Panel crear
  isNewOpen = signal(false);

  // Form
  form = this.fb.group({
    requestedRole: this.fb.nonNullable.control<'PARTNER'|'DISTRIBUTOR'>('PARTNER', [Validators.required]),
    roleToRemove:  this.fb.control<'CLIENT'|'DISTRIBUTOR'|'PARTNER' | null>(null),
    reason:        this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.isAdmin.set(this.auth.hasRole('ADMIN'));
    this.refresh();
  }

  toggleNew(): void {
    this.isNewOpen.set(!this.isNewOpen());
    if (!this.isNewOpen()) {
      this.form.reset({ requestedRole: 'PARTNER', roleToRemove: null, reason: null });
    }
  }

  // Cargas
  refresh(): void {
    this.loading.set(true);
    this.error.set(null);

    // Mis solicitudes (cliente)
    this.srv.listMine().subscribe({
      next: (list) => this.my.set(list ?? []),
      error: () => {},
      complete: () => this.loading.set(false)
    });

    // Pendientes (admin)
    if (this.isAdmin()) {
      this.srv.list({ status: 'PENDING', page: 1, pageSize: 20 }).subscribe({
        next: (res) => this.pending.set(res.items ?? []),
        error: () => {}
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = this.form.getRawValue() as CreateRoleRequestDTO;
    this.srv.create(payload).subscribe({
      next: () => {
        this.form.reset({ requestedRole: 'PARTNER', roleToRemove: null, reason: null });
        this.isNewOpen.set(false);
        this.refresh();
      },
      error: (e) => { this.error.set(e?.error?.message ?? 'No se pudo enviar la solicitud'); }
    });
  }

  // Acciones admin
  approve(item: RoleRequest): void {
    if (!confirm('¿Aprobar solicitud?')) return;
    this.srv.approve(item.id, 'Aprobado desde bandeja').subscribe({
      next: () => this.refresh()
    });
  }

  reject(item: RoleRequest): void {
    const reason = prompt('Motivo de rechazo:') ?? '';
    if (!reason.trim()) return;
    this.srv.reject(item.id, reason).subscribe({
      next: () => this.refresh()
    });
  }
}
