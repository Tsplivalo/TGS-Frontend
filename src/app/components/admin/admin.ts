import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin/admin';
import { AdminDTO, CreateAdminDTO, PatchAdminDTO } from '../../models/admin/admin.model';

/**
 * Componente: Admin
 *
 * - Un único panel (glass + card) que contiene header, filtros, mensajes y listado.
 * - Panel de crear/editar en un colapsable aparte, cerrado por defecto.
 * - Estado y UI reactivo con Signals.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.scss'],
})
export class AdminComponent implements OnInit {
  // Inyección
  private fb  = inject(FormBuilder);
  private srv = inject(AdminService);
  private tr = inject(TranslateService);

  // ── Estado base ──────────────────────────────────────────────────────────────
  items   = signal<AdminDTO[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);

  // Panel crear/editar (cerrado por defecto)
  isNewOpen = signal(false);
  isEdit    = signal(false);

  // Filtro
  fText = signal('');

  // ── Formulario ───────────────────────────────────────────────────────────────
  form = this.fb.group({
    dni:   this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    name:  this.fb.nonNullable.control('', [Validators.required]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    phone: this.fb.control<string | null>(null),
  });

  // ── Ciclo de vida ───────────────────────────────────────────────────────────
  ngOnInit(): void { this.load(); }

  // ── Derivados ───────────────────────────────────────────────────────────────
  filtered = computed(() => {
    const q = this.fText().toLowerCase().trim();
    return this.items().filter(it =>
      !q ||
      it.dni.toLowerCase().includes(q) ||
      it.name.toLowerCase().includes(q) ||
      (it.email?.toLowerCase().includes(q) ?? false) ||
      (it.phone?.toLowerCase().includes(q) ?? false)
    );
  });

  // ── Acciones UI ─────────────────────────────────────────────────────────────
  /** Abre/cierra el panel colapsable de crear/editar. */
  toggleNew(): void {
    const open = !this.isNewOpen();
    this.isNewOpen.set(open);
    if (!open) this.new();
  }

  /** Pone modo crear y limpia el form. */
  new(): void {
    this.isEdit.set(false);
    this.form.reset({ dni: '', name: '', email: '', phone: null });
  }

  /** Carga registro al form para editar y abre el panel. */
  edit(it: AdminDTO): void {
    this.isEdit.set(true);
    this.form.patchValue({ dni: it.dni, name: it.name, email: it.email, phone: it.phone ?? null });
    this.isNewOpen.set(true);
  }

  /** Crea/actualiza y refresca listado. */
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const payload = this.form.getRawValue();

    if (!this.isEdit()) {
      this.srv.create(payload as CreateAdminDTO).subscribe({
        next: () => { this.new(); this.isNewOpen.set(false); this.load(); },
        error: (e) => { this.error.set(e?.error?.message ?? 'Error creando'); this.loading.set(false); }
      });
    } else {
      const { dni, ...rest } = payload as any;
      this.srv.update(dni, rest as PatchAdminDTO).subscribe({
        next: () => { this.new(); this.isNewOpen.set(false); this.load(); },
        error: (e) => { this.error.set(e?.error?.message ?? 'Error guardando'); this.loading.set(false); }
      });
    }
  }

  /** Elimina tras confirmar y recarga. */
  delete(it: AdminDTO): void {
    const msg = this.tr.instant('common.delete') || 'Eliminar';
    const noun = this.tr.instant('admin.title') || 'Administrador';
    if (!confirm(`${msg} ${noun}?`)) return;
    this.srv.delete(it.dni).subscribe({ next: () => this.load() });
  }

  // trackBy helpers para *ngFor
  trackByDni = (_: number, it: AdminDTO) => it.dni;

  // ── Data ────────────────────────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    this.srv.list().subscribe({
      next: (res) => { this.items.set(res.data ?? []); this.loading.set(false); },
      error: (e) =>  { this.error.set(e?.error?.message ?? 'Error cargando'); this.loading.set(false); }
    });
  }
}
