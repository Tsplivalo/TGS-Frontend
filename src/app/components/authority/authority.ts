import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthorityService } from '../../services/authority/authority';
import { ApiResponse, AuthorityDTO, CreateAuthorityDTO, UpdateAuthorityDTO, PatchAuthorityDTO } from '../../models/authority/authority.model';

/**
 * AuthorityComponent
 *
 * CRUD de autoridades con:
 * - Filtro por texto y zona (signals + computed)
 * - Form reactivo con validaciones y toggles de requeridos
 * - Estrategia de guardado: POST (create), PATCH (solo zona) o PUT (nombre/rango/zona)
 * - Mensajes traducibles y estados de carga/errores
 */

type AuthorityForm = {
  dni: FormControl<string>;
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string | null>;
  address: FormControl<string | null>;
  rank: FormControl<'0' | '1' | '2' | '3'>;
  zoneId: FormControl<string>;
};

@Component({
  selector: 'app-authority',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './authority.html',
  styleUrls: ['./authority.scss']
})
export class AuthorityComponent implements OnInit {
  // --- Inyección ---
  private fb = inject(FormBuilder);
  private srv = inject(AuthorityService);
  private t = inject(TranslateService);

  // --- Estado base ---
  authorities = signal<AuthorityDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // Detección de modo edición (por DNI) y snapshot original para difs
  editDni = signal<string | null>(null);
  private original: Partial<UpdateAuthorityDTO & { dni: string }> | null = null;

  // --- Filtros de listado ---
  fZoneIdInput = signal<string>('');
  fZoneIdApplied = signal<string>('');
  fTextInput = signal('');
  fTextApplied = signal('');

  // --- Form reactivo ---
  form: FormGroup<AuthorityForm> = this.fb.group<AuthorityForm>({
    dni: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(6)] }),
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    phone: this.fb.control<string | null>(null),
    address: this.fb.control<string | null>(null),
    rank: this.fb.nonNullable.control('0', { validators: [Validators.required] }),
    zoneId: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  // --- Ciclo de vida ---
  ngOnInit(): void { this.load(); }

  // --- UI: abrir/cerrar formulario ---
  isFormOpen = false;
  toggleForm(){ this.isFormOpen = !this.isFormOpen; }

  // Texto amigable para la zona (fallback traducible)
  getZoneText(a: AuthorityDTO): string {
    const id = a?.zone?.id ?? '';
    const name = a?.zone?.name ?? this.t.instant('authorities.zone');
    return id ? `${id} - ${name}` : '—';
  }

  // Coincidencia básica por texto libre (dni, nombre, rank)
  private includesTxt(v: AuthorityDTO, q: string): boolean {
    const txt = q.toLowerCase();
    return (
      (v.dni ?? '').toLowerCase().includes(txt) ||
      (v.name ?? '').toLowerCase().includes(txt) ||
      String(v.rank ?? '').includes(txt)
    );
  }

  // Listado filtrado reactivo por texto y zona
  filteredAuthorities = computed(() => {
    const arr = this.authorities();
    const q = this.fTextApplied().trim();
    const z = this.fZoneIdApplied().trim();
    
    return arr.filter(a => {
      const matchQ = !q || this.includesTxt(a, q);
      const zoneIdFromDto = a?.zone?.id != null ? String(a.zone.id) : '';
      const matchZ = !z || zoneIdFromDto === z;
      return matchQ && matchZ;
    });
  });

  applyFilters() {
  this.fTextApplied.set(this.fTextInput());
  this.fZoneIdApplied.set(this.fZoneIdInput());
  }

  totalAuthorities = computed(() => this.authorities().length);
  authoritiesByRank = computed(() => {
    const byRank = { 0: 0, 1: 0, 2: 0, 3: 0 };
    this.authorities().forEach(a => {
      const rank = a.rank ?? 0;
      if (rank >= 0 && rank <= 3) byRank[rank as 0|1|2|3]++;
    });
    return byRank;
  });

  clearFilters() {
    this.fTextInput.set('');
    this.fZoneIdInput.set('');
    this.fTextApplied.set('');
    this.fZoneIdApplied.set('');
  }

  // --- Data fetching ---
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllAuthorities().subscribe({
      next: (res: ApiResponse<AuthorityDTO[]>) => { this.authorities.set(res.data ?? []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message || this.t.instant('authorities.errorLoad')); this.loading.set(false); }
    });
  }

  // Cambia dinámicamente si email es obligatorio (crear vs editar)
  private setEmailRequired(isRequired: boolean) {
    const emailCtrl = this.form.controls.email;
    if (isRequired) emailCtrl.setValidators([Validators.required, Validators.email]);
    else emailCtrl.setValidators([Validators.email]);
    emailCtrl.updateValueAndValidity({ emitEvent: false });
  }

  // --- Crear ---
  new() {
    this.editDni.set(null);
    this.original = null;
    this.setEmailRequired(true);
    this.form.reset({
      dni: '', name: '', email: '', phone: null, address: null, rank: '0', zoneId: ''
    } as any);
    this.submitted.set(false);
  }

  // --- Editar (email opcional y prefill; guardamos snapshot para PATCH selectivo) ---
  edit(a: AuthorityDTO) {
    this.setEmailRequired(false);
    const zoneId = a?.zone?.id != null ? String(a.zone.id) : '';
    this.editDni.set(a.dni);
    this.form.setValue({
      dni: a.dni ?? '',
      name: a.name ?? '',
      email: '',
      phone: null,
      address: null,
      rank: String(a.rank ?? '0') as '0'|'1'|'2'|'3',
      zoneId: zoneId,
    });
    this.original = { dni: a.dni ?? '', name: a.name ?? '', rank: String(a.rank ?? '0') as any, zoneId };
  }

  // --- Eliminar ---
  delete(dni: string) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteAuthority(dni).subscribe({
      next: () => this.load(),
      error: (err) => { this.error.set(err?.error?.message || this.t.instant('authorities.errorDelete')); this.loading.set(false); }
    });
  }

  // --- Builders de payload ---
  private buildCreatePayload(): CreateAuthorityDTO {
    const v = this.form.getRawValue();
    return {
      dni: String(v.dni).trim(),
      name: String(v.name).trim(),
      email: String(v.email).trim(),
      phone: v.phone?.trim() || undefined,
      address: v.address?.trim() || undefined,
      rank: v.rank,
      zoneId: String(v.zoneId).trim()
    };
  }

  private buildUpdatePayload(): UpdateAuthorityDTO {
    const v = this.form.getRawValue();
    return { name: String(v.name).trim(), rank: v.rank, zoneId: String(v.zoneId).trim() };
  }

  // PATCH solo envía campos realmente cambiados (respecto al snapshot original)
  private buildPatchPayload(): PatchAuthorityDTO {
    const v = this.form.getRawValue();
    const body: PatchAuthorityDTO = {};
    if (!this.original) return body;
    if (String(v.name).trim() !== (this.original.name ?? '')) body.name = String(v.name).trim();
    if (String(v.rank) !== String(this.original.rank)) body.rank = v.rank;
    if (String(v.zoneId).trim() !== (this.original.zoneId ?? '')) body.zoneId = String(v.zoneId).trim();
    return body;
  }

  // Validación ligera para zoneId numérico positivo (el backend valida definitivamente)
  private isZoneIdValid(): boolean {
    const z = this.form.controls.zoneId.value;
    const n = Number(z);
    return Number.isFinite(n) && n > 0;
  }

  // --- Guardar ---
  save() {
    this.submitted.set(true);

    // Validación simple de zona antes de tocar el backend
    if (!this.isZoneIdValid()) {
      this.form.controls.zoneId.markAsTouched();
      this.error.set(this.t.instant('authorities.err.zoneIdInvalid'));
      return;
    }

    const isEditing = !!this.editDni();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(isEditing ? this.t.instant('authorities.form.err.edit') : this.t.instant('authorities.form.err.create'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // CREATE
    if (!isEditing) {
      const payload = this.buildCreatePayload();
      this.srv.createAuthority(payload).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => { this.error.set(err?.error?.message || this.t.instant('authorities.errorCreate')); this.loading.set(false); }
      });
      return;
    }

    // EDIT: decidir PATCH vs PUT
    const patchBody = this.buildPatchPayload();
    const onlyZone = patchBody && Object.keys(patchBody).length === 1 && patchBody.zoneId != null;

    if (onlyZone) {
      // PATCH: solo cambio de zona
      this.srv.patchAuthority(this.editDni()!, patchBody).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => { this.error.set(err?.error?.message || this.t.instant('authorities.errorSavePatch')); this.loading.set(false); }
      });
    } else {
      // PUT: cambios de nombre/rango/zona
      const putBody = this.buildUpdatePayload();
      this.srv.updateAuthority(this.editDni()!, putBody).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => { this.error.set(err?.error?.message || this.t.instant('authorities.errorSavePut')); this.loading.set(false); }
      });
    }
  }
}
