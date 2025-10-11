import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PartnerService } from '../../services/partner/partner';
import {
  PartnerDTO,
  CreatePartnerDTO,
  PatchPartnerDTO,
  PartnerDecisionRefDTO
} from '../../models/partner/partner.model';

/**
 * Componente: Partner
 *
 * - Listado con filtro + panel colapsable para crear/editar.
 * - Estado reactivo con Signals (items, loading, error, isNewOpen, isEdit).
 * - Servicio HTTP tipado (create/update/delete + attach/detach de decisiones).
 *
 * UX:
 * - El botón “+ Nuevo / Cerrar” SOLO abre/cierra el panel de creación/edición.
 *   La tabla SIEMPRE permanece visible.
 * - El colapsable se controla con [class.open]="isNewOpen()" y estilos .collapsible.
 *
 * i18n:
 * - Se usa el namespace `partner.*` (singular), alineado con tus JSON.
 * - Para password se reutiliza `auth.fields.password`.
 * - Para el botón de “Agregar” (attach decisión) se reutiliza `store.add`.
 */
@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './partner.html',
  styleUrls: ['./partner.scss'],
})
export class PartnerComponent implements OnInit {
  // ─────────────────────────────────────────────
  // Inyección de dependencias
  // ─────────────────────────────────────────────
  private fb  = inject(FormBuilder);
  private srv = inject(PartnerService);
  private tr  = inject(TranslateService);

  // ─────────────────────────────────────────────
  // Estado base
  // ─────────────────────────────────────────────
  /** Lista cargada desde backend. */
  items   = signal<PartnerDTO[]>([]);
  /** Flag de carga para bloquear acciones y mostrar mensajes. */
  loading = signal(false);
  /** Último mensaje de error (o null si no hay). */
  error   = signal<string | null>(null);

  /** Colapsable del formulario crear/editar. */
  isNewOpen = signal(false);
  /** true cuando el form está editando un registro existente. */
  isEdit    = signal(false);

  /** Texto libre para filtrar el listado. */
  fText     = signal('');

  // ─────────────────────────────────────────────
  // Formulario crear/editar
  // ─────────────────────────────────────────────
  form = this.fb.group({
    dni:     this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    name:    this.fb.nonNullable.control('', [Validators.required]),
    email:   this.fb.control<string | null>(null, [Validators.email]),
    phone:   this.fb.control<string | null>(null),
    address: this.fb.control<string | null>(null),
    // Campo opcional (solo al crear/actualizar): si viene vacío, NO se envía en PATCH
    password: this.fb.control<string | null>(null),
  });

  /** Campo auxiliar para “adjuntar decisión por ID” a un socio. */
  decisionIdToAttach = this.fb.control<number | null>(null);

  // ─────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────
  ngOnInit(): void { this.load(); }

  // ─────────────────────────────────────────────
  // Derivados (listado filtrado)
  // ─────────────────────────────────────────────
  filtered = computed(() => {
    const q = this.fText().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter(it =>
      it.dni.toLowerCase().includes(q) ||
      it.name.toLowerCase().includes(q) ||
      (it.email?.toLowerCase().includes(q) ?? false) ||
      (it.phone?.toLowerCase().includes(q) ?? false) ||
      (it.address?.toLowerCase().includes(q) ?? false) ||
      (it.decisions ?? []).some(d => (String(d.id).includes(q) || (d.description ?? '').toLowerCase().includes(q)))
    );
  });

  // ─────────────────────────────────────────────
  // Acciones de UI
  // ─────────────────────────────────────────────
  /**
   * Abre/cierra el colapsable (sin ocultar la tabla).
   * - Al cerrar, resetea el formulario a modo “crear”.
   */
  toggleNew(): void {
    const open = !this.isNewOpen();
    this.isNewOpen.set(open);
    if (!open) this.new();
  }

  /** Vuelve a modo “crear” y limpia el formulario. */
  new(): void {
    this.isEdit.set(false);
    this.form.reset({
      dni: '', name: '', email: null, phone: null, address: null, password: null,
    });
    this.decisionIdToAttach.reset(null);
  }

  /** Carga un registro para edición y abre el panel. */
  edit(it: PartnerDTO): void {
    this.isEdit.set(true);
    this.form.patchValue({
      dni: it.dni,
      name: it.name,
      email: it.email ?? null,
      phone: it.phone ?? null,
      address: it.address ?? null,
      password: null // nunca se pre-carga
    });
    this.isNewOpen.set(true);
  }

  /**
   * Guarda el formulario:
   * - Si isEdit = false ⇒ create()
   * - Si isEdit = true  ⇒ update()
   */
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const payload = this.form.getRawValue();

    if (!this.isEdit()) {
      this.srv.create(payload as CreatePartnerDTO).subscribe({
        next: () => { this.new(); this.isNewOpen.set(false); this.load(); },
        error: (e) => {
          this.error.set(e?.error?.message ?? this.tr.instant('partner.errorCreate'));
          this.loading.set(false);
        }
      });
    } else {
      const { dni, password, ...rest } = payload as any;
      // Si el password viene vacío, no lo enviamos
      const patch: PatchPartnerDTO = { ...rest };
      if (password) (patch as any).password = password;
      this.srv.update(dni, patch).subscribe({
        next: () => { this.new(); this.isNewOpen.set(false); this.load(); },
        error: (e) => {
          this.error.set(e?.error?.message ?? this.tr.instant('partner.errorSave'));
          this.loading.set(false);
        }
      });
    }
  }

  /** Elimina un socio luego de confirmar. */
  delete(it: PartnerDTO): void {
    const msg = this.tr.instant('partner.confirmDelete', { dni: it.dni }) || '¿Eliminar socio?';
    if (!confirm(msg)) return;
    this.srv.delete(it.dni).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(e?.error?.message ?? this.tr.instant('partner.errorDelete'))
    });
  }

  /** Adjunta una decisión (por ID) al socio dado. */
  attachDecision(it: PartnerDTO): void {
    const id = this.decisionIdToAttach.value;
    if (!id || id <= 0) return;
    this.srv.attachDecision(it.dni, id).subscribe({
      next: (res) => {
        const updated = res.data;
        this.items.set(this.items().map(x => x.dni === it.dni ? updated : x));
        this.decisionIdToAttach.reset(null);
      }
    });
  }

  /** Quita (desvincula) una decisión del socio. */
  detachDecision(it: PartnerDTO, d: PartnerDecisionRefDTO): void {
    const msg = this.tr.instant('decisions.title') || '¿Quitar decisión?'; // Reutilizamos título de decisiones
    if (!confirm(`${msg}: #${d.id}`)) return;
    this.srv.detachDecision(it.dni, d.id).subscribe({
      next: (res) => {
        const updated = res.data;
        this.items.set(this.items().map(x => x.dni === it.dni ? updated : x));
      }
    });
  }

  // trackBy para rendimiento en *ngFor
  trackByDni = (_: number, it: PartnerDTO) => it.dni;

  // ─────────────────────────────────────────────
  // Carga de datos
  // ─────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    const q = this.fText().trim() || undefined;
    this.srv.list({ q }).subscribe({
      next: (res) => { this.items.set(res.data ?? []); this.loading.set(false); },
      error: (e)  => {
        this.error.set(e?.error?.message ?? this.tr.instant('partner.errorLoad'));
        this.loading.set(false);
      }
    });
  }
}
