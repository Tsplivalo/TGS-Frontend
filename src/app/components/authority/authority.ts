import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthorityService } from '../../services/authority/authority';
import { ApiResponse, AuthorityDTO, CreateAuthorityDTO, UpdateAuthorityDTO, PatchAuthorityDTO } from '../../models/authority/authority.model';
import { AuthService, User } from '../../services/user/user';
import { ZoneService } from '../../services/zone/zone';
import { ZoneDTO } from '../../models/zone/zona.model';

type Mode = 'fromUser' | 'manual';

/**
 * AuthorityComponent
 *
 * CRUD de autoridades con:
 * - Filtro por texto y zona (signals + computed)
 * - Form reactivo con validaciones y toggles de requeridos
 * - Estrategia de guardado: POST (create), PATCH (solo zona) o PUT (nombre/rango/zona)
 * - Mensajes traducibles y estados de carga/errores
 * - ✅ Notificaciones de éxito y cierre automático del formulario
 */

type AuthorityForm = {
  dni: FormControl<string>;
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string | null>;
  address: FormControl<string | null>;
  rank: FormControl<'0' | '1' | '2' | '3'>;
  zoneId: FormControl<string>;
  createCreds: FormControl<boolean>;
  username: FormControl<string>;
  password: FormControl<string>;
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
  private zoneSrv = inject(ZoneService);
  private t = inject(TranslateService);
  private authSrv = inject(AuthService);

  // --- Estado base ---
  authorities = signal<AuthorityDTO[]>([]);
  zones = signal<ZoneDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null); // ✅ Mensaje de éxito
  submitted = signal(false);

  // Detección de modo edición (por DNI) y snapshot original para difs
  editDni = signal<string | null>(null);
  private original: Partial<UpdateAuthorityDTO & { dni: string }> | null = null;

  // --- Modo de creación ---
  mode = signal<Mode>('fromUser');

  // --- Mostrar/ocultar contraseña ---
  showPassword = signal(false);

  // --- Usuarios verificados (selector) ---
  users = signal<User[]>([]);
  userSearch = signal<string>('');
  selectedUserDni = signal<string | null>(null);

  filteredUsers = computed(() => {
    const q = this.userSearch().toLowerCase().trim();
    const arr = this.users();
    if (!q) return arr;
    return arr.filter(u => {
      const person = (u as any).person;
      if (!person) return false;
      return (
        (person.dni ?? '').toLowerCase().includes(q) ||
        (person.name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
    });
  });

  // --- Filtros de listado ---
  fDniInput = signal<string>('');      
  fDniApplied = signal<string>(''); 
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
    createCreds: this.fb.control<boolean>(false, { nonNullable: true }),
    username: this.fb.control<string>('', { nonNullable: true }),
    password: this.fb.control<string>('', { nonNullable: true }),
  });

  // --- Ciclo de vida ---
  ngOnInit(): void {
    this.load();
    this.loadZones();
    this.loadVerifiedUsers();
    this.applyCredsAvailabilityByMode(this.mode());

    // Normaliza zoneId si viene como número desde el <select>
    this.form.controls.zoneId.valueChanges.subscribe(v => {
      if (typeof v === 'number') {
        this.form.controls.zoneId.setValue(String(v), { emitEvent: false });
      }
    });
  }

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
    const q = this.fTextApplied().trim().toLowerCase();
    const dni = this.fDniApplied().trim();
    const z = this.fZoneIdApplied().trim();
    
    return arr.filter(a => {
      // Filtro por DNI específico
      const matchDni = !dni || (a.dni ?? '').includes(dni);
      
      // Filtro por zona
      const zoneIdFromDto = a?.zone?.id != null ? String(a.zone.id) : '';
      const matchZ = !z || zoneIdFromDto === z;
      
      // Filtro por texto en nombre y rango
      let matchQ = true;
      if (q) {
        const isNumericOnly = /^\d+$/.test(q);
        
        if (isNumericOnly) {
          // Si es solo números, buscar SOLO por rango
          const numValue = parseInt(q);
          matchQ = a.rank === numValue;
        } else {
          // Si contiene letras, buscar SOLO en nombre
          matchQ = (a.name ?? '').toLowerCase().includes(q);
        }
      }
      
      return matchDni && matchZ && matchQ;
    });
  });

  applyFilters() {
    this.fTextApplied.set(this.fTextInput());
    this.fDniApplied.set(this.fDniInput());
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
    this.fDniInput.set('');
    this.fZoneIdInput.set('');
    this.fTextApplied.set('');
    this.fDniApplied.set('');
    this.fZoneIdApplied.set('');
  }

  // --- Data fetching ---
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllAuthorities().subscribe({
      next: (res: ApiResponse<AuthorityDTO[]>) => {
        this.authorities.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || this.t.instant('authorities.errorLoad'));
        this.loading.set(false);
      }
    });
  }

  loadZones() {
    this.zoneSrv.getAllZones().subscribe({
      next: (res: any) => {
        const zones = res?.data ?? res ?? [];
        this.zones.set(Array.isArray(zones) ? zones : []);
      },
      error: (err) => {
        console.error('Error loading zones:', err);
      }
    });
  }

  private loadVerifiedUsers(): void {
    // Filtrar usuarios elegibles para ser AUTHORITY
    this.authSrv.getAllVerifiedUsers('AUTHORITY').subscribe({
      next: (verifiedUsers) => {
        this.users.set(verifiedUsers);
        console.log(`[AuthorityComponent] Loaded ${verifiedUsers.length} verified users eligible for AUTHORITY role`);
      },
      error: (err) => {
        console.error('[AuthorityComponent] Error loading verified users:', err);
        this.users.set([]);  // Array vacío en caso de error
      }
    });
  }

  // Habilita / deshabilita validadores de credenciales
  private toggleCredsValidators(enable: boolean) {
    if (enable) {
      this.form.controls.username.setValidators([Validators.required, Validators.minLength(3)]);
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      this.form.controls.username.clearValidators();
      this.form.controls.password.clearValidators();
      this.form.patchValue({ username: '', password: '' });
    }
    this.form.controls.username.updateValueAndValidity({ emitEvent: false });
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
  }

  // Aplica disponibilidad según modo
  private applyCredsAvailabilityByMode(mode: Mode) {
    if (mode === 'fromUser') {
      // Forzar oculto y limpio
      this.form.patchValue({ createCreds: false, username: '', password: '' });
      this.toggleCredsValidators(false);
    } else {
      // Modo manual: respetar toggle actual
      const create = !!this.form.controls.createCreds.value;
      this.toggleCredsValidators(create);
    }
  }

  // Handler de toggle en template
  onCredsToggle(ev: Event) {
    const checked = !!(ev.target as HTMLInputElement).checked;
    this.form.controls.createCreds.setValue(checked);
    this.toggleCredsValidators(checked);
  }

  // Toggle para mostrar/ocultar contraseña
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  // Helper para obtener datos de persona desde usuario
  getUserPerson(user: User): any {
    return (user as any).person;
  }

  getUserPersonDni(user: User): string {
    return (user as any).person?.dni ?? '';
  }

  onModeChange(ev: Event) {
    const val = (ev.target as HTMLInputElement).value as Mode;
    this.mode.set(val);
    this.applyCredsAvailabilityByMode(val);
    if (val === 'manual') {
      this.selectedUserDni.set(null);
    }
  }

  onSelectUser(ev: Event) {
    const dni = (ev.target as HTMLSelectElement).value || '';
    if (!dni) {
      this.selectedUserDni.set(null);
      return;
    }
    this.selectedUserDni.set(dni);
    const u = this.users().find(x => (x as any).person?.dni === dni);
    if (u && (u as any).person) {
      const person = (u as any).person;
      this.form.patchValue({
        dni: person.dni ?? '',
        name: person.name ?? '',
        email: u.email ?? '',
        address: person.address ?? '',
        phone: person.phone ?? ''
      });
    }
  }

  // Método para seleccionar usuario directamente desde la lista
  selectUserByDni(dni: string) {
    if (!dni) {
      this.selectedUserDni.set(null);
      return;
    }
    this.selectedUserDni.set(dni);
    const u = this.users().find(x => (x as any).person?.dni === dni);
    if (u && (u as any).person) {
      const person = (u as any).person;
      this.form.patchValue({
        dni: person.dni ?? '',
        name: person.name ?? '',
        email: u.email ?? '',
        address: person.address ?? '',
        phone: person.phone ?? ''
      });
    }
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
    this.mode.set('fromUser');
    this.selectedUserDni.set(null);
    this.userSearch.set('');
    this.setEmailRequired(true);
    this.form.reset({
      dni: '', name: '', email: '', phone: null, address: null, rank: '0', zoneId: '',
      createCreds: false, username: '', password: ''
    } as any);
    this.applyCredsAvailabilityByMode('fromUser');
    this.submitted.set(false);
  }

  // --- Editar (email opcional y prefill; guardamos snapshot para PATCH selectivo) ---
  edit(a: AuthorityDTO) {
    this.setEmailRequired(false);
    const zoneId = a?.zone?.id != null ? String(a.zone.id) : '';
    this.editDni.set(a.dni);
    this.mode.set('manual'); // Al editar, modo manual
    this.form.setValue({
      dni: a.dni ?? '',
      name: a.name ?? '',
      email: '',
      phone: null,
      address: null,
      rank: String(a.rank ?? '0') as '0'|'1'|'2'|'3',
      zoneId: zoneId,
      createCreds: false,
      username: '',
      password: ''
    });
    this.applyCredsAvailabilityByMode('manual');
    this.original = { dni: a.dni ?? '', name: a.name ?? '', rank: String(a.rank ?? '0') as any, zoneId };
  }

  // --- Eliminar ---
  delete(dni: string) {
    if (!confirm(this.t.instant('authorities.confirmDelete'))) return;
    
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null); // ✅ Limpiar mensaje previo
    
    this.srv.deleteAuthority(dni).subscribe({
      next: () => {
        // ✅ Mostrar mensaje de éxito
        this.success.set(this.t.instant('authorities.successDelete') || 'Autoridad eliminada correctamente');

        this.load();
        this.loadVerifiedUsers(); // ✅ Recargar usuarios verificados

        // ✅ Auto-ocultar después de 5 segundos
        setTimeout(() => this.success.set(null), 5000);
      },
      error: (err) => { 
        this.error.set(err?.error?.message || this.t.instant('authorities.errorDelete')); 
        this.loading.set(false); 
      }
    });
  }

  // --- Builders de payload ---
  private buildCreatePayload(): CreateAuthorityDTO {
    const v = this.form.getRawValue();
    const isManual = this.mode() === 'manual';
    const wantCreds = isManual && !!v.createCreds;

    return {
      dni: String(v.dni).trim(),
      name: String(v.name).trim(),
      email: String(v.email).trim(),
      phone: v.phone?.trim() || undefined,
      address: v.address?.trim() || undefined,
      rank: v.rank,
      zoneId: String(v.zoneId).trim(),
      ...(wantCreds ? {
        // ✅ Usar el username del formulario - ahora el login acepta email o username
        username: (v.username || '').trim(),
        password: (v.password || '').trim(),
      } : {})
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
    this.success.set(null); // ✅ Limpiar mensaje previo

    // CREATE
    if (!isEditing) {
      const payload = this.buildCreatePayload();
      this.srv.createAuthority(payload).subscribe({
        next: () => {
          // ✅ Mostrar mensaje de éxito
          this.success.set(this.t.instant('authorities.successCreate') || `Autoridad "${payload.name}" creada correctamente`);

          this.new();
          this.load();
          this.loadVerifiedUsers(); // ✅ Recargar usuarios verificados

          // ✅ Cerrar formulario
          this.isFormOpen = false;

          // ✅ Auto-ocultar después de 5 segundos
          setTimeout(() => this.success.set(null), 5000);
        },
        error: (err) => { 
          this.error.set(err?.error?.message || this.t.instant('authorities.errorCreate')); 
          this.loading.set(false); 
        }
      });
      return;
    }

    // EDIT: decidir PATCH vs PUT
    const patchBody = this.buildPatchPayload();
    const onlyZone = patchBody && Object.keys(patchBody).length === 1 && patchBody.zoneId != null;

    if (onlyZone) {
      // PATCH: solo cambio de zona
      this.srv.patchAuthority(this.editDni()!, patchBody).subscribe({
        next: () => { 
          // ✅ Mostrar mensaje de éxito
          this.success.set(this.t.instant('authorities.successUpdate') || 'Autoridad actualizada correctamente');
          
          this.new(); 
          this.load();
          
          // ✅ Cerrar formulario
          this.isFormOpen = false;
          
          // ✅ Auto-ocultar después de 5 segundos
          setTimeout(() => this.success.set(null), 5000);
        },
        error: (err) => { 
          this.error.set(err?.error?.message || this.t.instant('authorities.errorSavePatch')); 
          this.loading.set(false); 
        }
      });
    } else {
      // PUT: cambios de nombre/rango/zona
      const putBody = this.buildUpdatePayload();
      this.srv.updateAuthority(this.editDni()!, putBody).subscribe({
        next: () => { 
          // ✅ Mostrar mensaje de éxito
          this.success.set(this.t.instant('authorities.successUpdate') || 'Autoridad actualizada correctamente');
          
          this.new(); 
          this.load();
          
          // ✅ Cerrar formulario
          this.isFormOpen = false;
          
          // ✅ Auto-ocultar después de 5 segundos
          setTimeout(() => this.success.set(null), 5000);
        },
        error: (err) => { 
          this.error.set(err?.error?.message || this.t.instant('authorities.errorSavePut')); 
          this.loading.set(false); 
        }
      });
    }
  }
}