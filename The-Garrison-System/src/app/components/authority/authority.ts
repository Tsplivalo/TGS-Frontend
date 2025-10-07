import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormArray, FormBuilder, Validators, FormControl, FormGroup, AbstractControl
} from '@angular/forms';
import { AuthorityService } from '../../services/authority/authority';
import {
  ApiResponse,
  AuthorityDTO,
  CreateAuthorityDTO,
  UpdateAuthorityDTO,
  PatchAuthorityDTO,
} from '../../models/authority/authority.model';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './authority.html',
  styleUrls: ['./authority.scss']
})
export class AuthorityComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(AuthorityService);

  authorities = signal<AuthorityDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // Edit mode uses DNI as id
  editDni = signal<string | null>(null);

  // Snapshot to detect changes
  private original: Partial<UpdateAuthorityDTO & { dni: string }> | null = null;

  // Filters
  fZoneId: string | null = null;
  fText = '';

  form: FormGroup<AuthorityForm> = this.fb.group<AuthorityForm>({
    dni: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(6)] }),
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    phone: this.fb.control<string | null>(null),
    address: this.fb.control<string | null>(null),
    rank: this.fb.nonNullable.control('0', { validators: [Validators.required] }),
    zoneId: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.load();
  }

  isFormOpen = false;
  toggleForm(){ this.isFormOpen = !this.isFormOpen; }


  // ===== Template helpers (to avoid "as any" in HTML) =====
  getZoneText(a: AuthorityDTO): string {
    const id = a?.zone?.id ?? '';
    const name = a?.zone?.name ?? 'Zone';
    return id ? `${id} - ${name}` : '—';
  }

  // ===== Listing (with UI filters) =====
  private includesTxt(v: AuthorityDTO, q: string): boolean {
    const txt = q.toLowerCase();
    return (
      (v.dni ?? '').toLowerCase().includes(txt) ||
      (v.name ?? '').toLowerCase().includes(txt) ||
      String(v.rank ?? '').includes(txt)
    );
  }

  filteredAuthorities = computed(() => {
    const arr = this.authorities();
    const q = (this.fText || '').trim();
    const z = (this.fZoneId || '').trim();

    return arr.filter(a => {
      const matchQ = !q || this.includesTxt(a, q);
      const zoneIdFromDto = a?.zone?.id != null ? String(a.zone.id) : '';
      const matchZ = !z || zoneIdFromDto === z;
      return matchQ && matchZ;
    });
  });

  // ===== CRUD =====
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllAuthorities().subscribe({
      next: (res: ApiResponse<AuthorityDTO[]>) => {
        this.authorities.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not load authorities.');
        this.loading.set(false);
      }
    });
  }

  private setEmailRequired(isRequired: boolean) {
    const emailCtrl = this.form.controls.email;
    if (isRequired) {
      emailCtrl.setValidators([Validators.required, Validators.email]);
    } else {
      emailCtrl.setValidators([Validators.email]); // optional in edit
    }
    emailCtrl.updateValueAndValidity({ emitEvent: false });
  }

  new() {
    this.editDni.set(null);
    this.original = null;
    // email is required on create
    this.setEmailRequired(true);

    this.form.reset({
      dni: '',
      name: '',
      email: '',
      phone: null,
      address: null,
      rank: '0',
      zoneId: ''
    } as any);
    this.submitted.set(false);
  }

  edit(a: AuthorityDTO) {
    // email is NOT required by the backend on edit
    this.setEmailRequired(false);

    const zoneId = a?.zone?.id != null ? String(a.zone.id) : '';
    this.editDni.set(a.dni);

    // Fill with backend data; email/phone/address may not come
    this.form.setValue({
      dni: a.dni ?? '',
      name: a.name ?? '',
      email: '',                 // editable, not required in edit
      phone: null,
      address: null,
      rank: String(a.rank ?? '0') as '0'|'1'|'2'|'3',
      zoneId: zoneId,
    });

    // Snapshot to detect changes (on PUT fields)
    this.original = {
      dni: a.dni ?? '',
      name: a.name ?? '',
      rank: String(a.rank ?? '0') as '0'|'1'|'2'|'3',
      zoneId: zoneId,
    };
  }

  delete(dni: string) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteAuthority(dni).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not delete.');
        this.loading.set(false);
      }
    });
  }

  private buildCreatePayload(): CreateAuthorityDTO {
    const v = this.form.getRawValue();
    return {
      dni: String(v.dni).trim(),
      name: String(v.name).trim(),
      email: String(v.email).trim(),
      phone: v.phone?.trim() || undefined,
      address: v.address?.trim() || undefined,
      rank: v.rank,                  // '0'|'1'|'2'|'3'
      zoneId: String(v.zoneId).trim()  // string (back transforms to number)
    };
  }

  private buildUpdatePayload(): UpdateAuthorityDTO {
    const v = this.form.getRawValue();
    return {
      name: String(v.name).trim(),
      rank: v.rank,
      zoneId: String(v.zoneId).trim()
    };
  }

  private buildPatchPayload(): PatchAuthorityDTO {
    const v = this.form.getRawValue();
    const body: PatchAuthorityDTO = {};
    // Only send what changed from the snapshot
  if (!this.original) return body;
  if (String(v.name).trim() !== (this.original.name ?? '')) body.name = String(v.name).trim();
  if (String(v.rank) !== String(this.original.rank)) body.rank = v.rank;
  if (String(v.zoneId).trim() !== (this.original.zoneId ?? '')) body.zoneId = String(v.zoneId).trim();
  return body;
  }

  private isZoneIdValid(): boolean {
  const z = this.form.controls.zoneId.value;
  const n = Number(z);
  return Number.isFinite(n) && n > 0;
  }

  save() {
    this.submitted.set(true);

    // Base validations
    if (!this.isZoneIdValid()) {
  this.form.controls.zoneId.markAsTouched();
      this.error.set('Zone ID must be a valid number greater than 0.');
      return;
    }

    const isEditing = !!this.editDni();

    // On create, email is required; not on edit
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(isEditing
        ? 'Complete Name, Rank and Zone (email is not required when editing).'
        : 'Complete DNI, Name, Email, Rank and Zone.'
      );
      console.warn('[AUTHORITY] Invalid form:', {
        status: this.form.status,
        errors: this.form.errors,
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!isEditing) {
      // CREATE (POST)
      const payload = this.buildCreatePayload();
      console.log('[AUTHORITY] POST payload:', payload);
      this.srv.createAuthority(payload).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => {
          const msg = err?.error?.message || 'Could not create.';
          this.error.set(msg);
          this.loading.set(false);
          console.error('[AUTHORITY] Error creating:', err);
        }
      });
      return;
    }

    // EDIT: we prefer PATCH if only zone (or few fields) changed
    const patchBody = this.buildPatchPayload();
    const onlyZone = patchBody && Object.keys(patchBody).length === 1 && patchBody.zoneId != null;

    if (onlyZone) {
      console.log('[AUTHORITY] PATCH payload:', patchBody);
      this.srv.patchAuthority(this.editDni()!, patchBody).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => {
          const msg = err?.error?.message || 'Could not save (PATCH).';
          this.error.set(msg);
          this.loading.set(false);
          console.error('[AUTHORITY] Error updating (PATCH):', err);
        }
      });
    } else {
      // Full PUT
      const putBody = this.buildUpdatePayload();
      console.log('[AUTHORITY] PUT payload:', putBody);
      this.srv.updateAuthority(this.editDni()!, putBody).subscribe({
        next: () => { this.new(); this.load(); },
        error: (err) => {
          const msg = err?.error?.message || 'Could not save (PUT).';
          this.error.set(msg);
          this.loading.set(false);
          console.error('[AUTHORITY] Error updating (PUT):', err);
        }
      });
    }
  }
}