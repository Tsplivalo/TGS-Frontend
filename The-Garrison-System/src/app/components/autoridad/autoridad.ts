import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormArray, FormBuilder, Validators, FormControl, FormGroup, AbstractControl
} from '@angular/forms';
import { AutoridadService } from '../../services/autoridad/autoridad';
import {
  ApiResponse,
  AutoridadDTO,
  CreateAutoridadDTO,
  UpdateAutoridadDTO,
  PatchAutoridadDTO,
} from '../../models/autoridad/autoridad.model';

type AutoridadForm = {
  dni: FormControl<string>;
  nombre: FormControl<string>;
  email: FormControl<string>;
  telefono: FormControl<string | null>;
  direccion: FormControl<string | null>;
  rango: FormControl<'0' | '1' | '2' | '3'>;
  zonaId: FormControl<string>;
};

@Component({
  selector: 'app-autoridad',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './autoridad.html',
  styleUrls: ['./autoridad.scss']
})
export class AutoridadComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(AutoridadService);

  autoridades = signal<AutoridadDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // Modo edición usa el DNI como id
  editDni = signal<string | null>(null);

  // Snapshot para detectar cambios
  private original: Partial<UpdateAutoridadDTO & { dni: string }> | null = null;

  // Filtros
  fZonaId: string | null = null;
  fTexto = '';

  form: FormGroup<AutoridadForm> = this.fb.group<AutoridadForm>({
    dni: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(6)] }),
    nombre: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(2)] }),
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    telefono: this.fb.control<string | null>(null),
    direccion: this.fb.control<string | null>(null),
    rango: this.fb.nonNullable.control('0', { validators: [Validators.required] }),
    zonaId: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.cargar();
  }

  // ===== Helpers para template (evitar "as any" en HTML) =====
  getZonaTexto(a: AutoridadDTO): string {
    const id = a?.zona?.id ?? '';
    const nombre = a?.zona?.nombre ?? 'Zona';
    return id ? `${id} - ${nombre}` : '—';
  }

  // ===== Listado (con filtros UI) =====
  private incluyeTxt(v: AutoridadDTO, q: string): boolean {
    const txt = q.toLowerCase();
    return (
      (v.dni ?? '').toLowerCase().includes(txt) ||
      (v.nombre ?? '').toLowerCase().includes(txt) ||
      String(v.rango ?? '').includes(txt)
    );
  }

  autoridadesFiltradas = computed(() => {
    const arr = this.autoridades();
    const q = (this.fTexto || '').trim();
    const z = (this.fZonaId || '').trim();

    return arr.filter(a => {
      const matchQ = !q || this.incluyeTxt(a, q);
      const zonaIdFromDto = a?.zona?.id != null ? String(a.zona.id) : '';
      const matchZ = !z || zonaIdFromDto === z;
      return matchQ && matchZ;
    });
  });

  // ===== CRUD =====
  cargar() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllAutoridades().subscribe({
      next: (res: ApiResponse<AutoridadDTO[]>) => {
        this.autoridades.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudieron cargar las autoridades.');
        this.loading.set(false);
      }
    });
  }

  private setEmailRequired(isRequired: boolean) {
    const emailCtrl = this.form.controls.email;
    if (isRequired) {
      emailCtrl.setValidators([Validators.required, Validators.email]);
    } else {
      emailCtrl.setValidators([Validators.email]); // opcional en edición
    }
    emailCtrl.updateValueAndValidity({ emitEvent: false });
  }

  nuevo() {
    this.editDni.set(null);
    this.original = null;
    // En crear: email requerido
    this.setEmailRequired(true);

    this.form.reset({
      dni: '',
      nombre: '',
      email: '',
      telefono: null,
      direccion: null,
      rango: '0',
      zonaId: ''
    } as any);
    this.submitted.set(false);
  }

  editar(a: AutoridadDTO) {
    // En edición: email NO requerido por el backend
    this.setEmailRequired(false);

    const zonaId = a?.zona?.id != null ? String(a.zona.id) : '';
    this.editDni.set(a.dni);

    // Relleno lo que trae el back; email/telefono/direccion pueden no venir
    this.form.setValue({
      dni: a.dni ?? '',
      nombre: a.nombre ?? '',
      email: '',                 // editable, no requerido en edición
      telefono: null,
      direccion: null,
      rango: String(a.rango ?? '0') as '0'|'1'|'2'|'3',
      zonaId: zonaId,
    });

    // Snapshot para detectar cambios (sobre campos del PUT)
    this.original = {
      dni: a.dni ?? '',
      nombre: a.nombre ?? '',
      rango: String(a.rango ?? '0') as '0'|'1'|'2'|'3',
      zonaId: zonaId,
    };
  }

  eliminar(dni: string) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteAutoridad(dni).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo eliminar.');
        this.loading.set(false);
      }
    });
  }

  private buildCreatePayload(): CreateAutoridadDTO {
    const v = this.form.getRawValue();
    return {
      dni: String(v.dni).trim(),
      nombre: String(v.nombre).trim(),
      email: String(v.email).trim(),
      telefono: v.telefono?.trim() || undefined,
      direccion: v.direccion?.trim() || undefined,
      rango: v.rango,                  // '0'|'1'|'2'|'3'
      zonaId: String(v.zonaId).trim()  // string (back lo transforma a number)
    };
  }

  private buildUpdatePayload(): UpdateAutoridadDTO {
    const v = this.form.getRawValue();
    return {
      nombre: String(v.nombre).trim(),
      rango: v.rango,
      zonaId: String(v.zonaId).trim()
    };
  }

  private buildPatchPayload(): PatchAutoridadDTO {
    const v = this.form.getRawValue();
    const body: PatchAutoridadDTO = {};
    // Solo mandamos lo que cambió respecto al snapshot
    if (!this.original) return body;
    if (String(v.nombre).trim() !== (this.original.nombre ?? '')) body.nombre = String(v.nombre).trim();
    if (String(v.rango) !== String(this.original.rango)) body.rango = v.rango;
    if (String(v.zonaId).trim() !== (this.original.zonaId ?? '')) body.zonaId = String(v.zonaId).trim();
    return body;
  }

  private zonaIdValida(): boolean {
    const z = this.form.controls.zonaId.value;
    const n = Number(z);
    return Number.isFinite(n) && n > 0;
  }

  guardar() {
    this.submitted.set(true);

    // Validaciones base
    if (!this.zonaIdValida()) {
      this.form.controls.zonaId.markAsTouched();
      this.error.set('Zona ID debe ser un número válido mayor a 0.');
      return;
    }

    const enEdicion = !!this.editDni();

    // En crear, email es requerido; en edición no
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(enEdicion
        ? 'Completá Nombre, Rango y Zona (email no es requerido en edición).'
        : 'Completá DNI, Nombre, Email, Rango y Zona.'
      );
      console.warn('[AUTORIDAD] Form inválido:', {
        status: this.form.status,
        errors: this.form.errors,
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!enEdicion) {
      // CREATE (POST)
      const payload = this.buildCreatePayload();
      console.log('[AUTORIDAD] POST payload:', payload);
      this.srv.createAutoridad(payload).subscribe({
        next: () => { this.nuevo(); this.cargar(); },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo crear.';
          this.error.set(msg);
          this.loading.set(false);
          console.error('[AUTORIDAD] Error creando:', err);
        }
      });
      return;
    }

    // EDICIÓN: preferimos PATCH si sólo cambió zona (o pocos campos)
    const patchBody = this.buildPatchPayload();
    const soloZona = patchBody && Object.keys(patchBody).length === 1 && patchBody.zonaId != null;

    if (soloZona) {
      console.log('[AUTORIDAD] PATCH payload:', patchBody);
      this.srv.patchAutoridad(this.editDni()!, patchBody).subscribe({
        next: () => { this.nuevo(); this.cargar(); },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo guardar (PATCH).';
          this.error.set(msg);
          this.loading.set(false);
          console.error('[AUTORIDAD] Error actualizando (PATCH):', err);
        }
      });
    } else {
      // PUT completo
      const putBody = this.buildUpdatePayload();
      console.log('[AUTORIDAD] PUT payload:', putBody);
      this.srv.updateAutoridad(this.editDni()!, putBody).subscribe({
        next: () => { this.nuevo(); this.cargar(); },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo guardar (PUT).';
          this.error.set(msg);
          this.loading.set(false);
          console.error('[AUTORIDAD] Error actualizando (PUT):', err);
        }
      });
    }
  }
}
