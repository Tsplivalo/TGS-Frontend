import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RoleRequestService } from '../../services/role-request/role-request';
import { RoleRequestDTO, CreateRoleRequestDTO } from '../../models/role-request/role-request.model';
import { AuthService } from '../../services/auth/auth';

/**
 * Componente: RoleRequest
 *
 * - Un único panel (glass + card) que contiene header, mensajes y listados.
 * - Panel de crear en un colapsable aparte, cerrado por defecto.
 * - Estado y UI con Signals, sin tocar tu lógica de servicios.
 */
@Component({
  selector: 'app-role-request',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './role-request.html',
  styleUrls: ['./role-request.scss'],
})
export class RoleRequestComponent implements OnInit {
  // Inyección
  private fb   = inject(FormBuilder);
  private srv  = inject(RoleRequestService);
  private auth = inject(AuthService);

  // ── Estado base ──────────────────────────────────────────────────────────────
  my      = signal<RoleRequestDTO[]>([]);
  pending = signal<RoleRequestDTO[]>([]);
  isAdmin = signal(false);
  loading = signal(false);
  error   = signal<string | null>(null);

  // Panel crear (colapsable)
  isNewOpen = signal(false);

  // ── Formulario ───────────────────────────────────────────────────────────────
  form = this.fb.group({
    requestedRole: this.fb.nonNullable.control<'PARTNER'|'DISTRIBUTOR'>('PARTNER', [Validators.required]),
    roleToRemove:  this.fb.control<'CLIENT'|'DISTRIBUTOR'|'PARTNER' | null>(null),
    reason:        this.fb.control<string | null>(null),
  });

  // ── Ciclo de vida ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.isAdmin.set(this.auth.hasRole('ADMIN')); // no toco tu AuthService
    this.refresh();
  }

  // ── Acciones UI ─────────────────────────────────────────────────────────────
  toggleNew(): void {
    this.isNewOpen.set(!this.isNewOpen());
    if (!this.isNewOpen()) {
      this.form.reset({ requestedRole: 'PARTNER', roleToRemove: null, reason: null });
    }
  }

  // ── Llamadas a API ──────────────────────────────────────────────────────────
  refresh(): void {
    this.loading.set(true);
    const done = () => this.loading.set(false);

    this.srv.myRequests().subscribe({
      next: (r) => this.my.set(r.data ?? []),
      error: () => {},
      complete: done
    });

    if (this.isAdmin()) {
      this.srv.pending().subscribe({
        next: (r) => this.pending.set(r.data ?? []),
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

  approve(item: RoleRequestDTO): void {
    if (!confirm('¿Aprobar solicitud?')) return;
    this.srv.review(item.id, { status: 'APPROVED', adminNotes: 'OK' }).subscribe({ next: () => this.refresh() });
  }

  reject(item: RoleRequestDTO): void {
    if (!confirm('¿Rechazar solicitud?')) return;
    this.srv.review(item.id, { status: 'REJECTED', adminNotes: 'No cumple requisitos' }).subscribe({ next: () => this.refresh() });
  }
}
