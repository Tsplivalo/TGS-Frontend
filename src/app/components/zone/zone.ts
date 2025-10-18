import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ZoneService } from '../../services/zone/zone';
import { ApiResponse, ZoneDTO } from '../../models/zone/zona.model';

/**
 * ZoneComponent
 *
 * ABM de zonas con filtro por texto, manejo de sede central (no eliminable)
 * y validación de nombre duplicado en modo edición.
 */

@Component({
  selector: 'app-zone',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './zone.html',
  styleUrls: ['./zone.scss']
})
export class ZoneComponent implements OnInit {
  // --- Inyección ---
  private fb = inject(FormBuilder);
  private srv = inject(ZoneService);
  private t = inject(TranslateService);

  // --- Estado ---
  loading = signal(false);
  error   = signal<string | null>(null);
  editId  = signal<number | null>(null); // null → creando, número → editando

  // --- Datos ---
  zones = signal<ZoneDTO[]>([]);
  fTextInput = signal('');
  fTextApplied = signal('');

  // Listado filtrado por id/nombre/descripción
  filteredList = computed(() => {
    const txt = this.fTextApplied().toLowerCase().trim();
    return this.zones().filter(z => {
      const matchText = !txt
        || String(z.id).includes(txt)
        || z.name.toLowerCase().includes(txt)
        || (z.description ?? '').toLowerCase().includes(txt);
      return matchText;
    });
  });

  applyFilters() {
  this.fTextApplied.set(this.fTextInput());
  }

  clearFilters() {
    this.fTextInput.set('');
    this.fTextApplied.set('');
  }

  // Única sede central (si existe) para destacar en UI o bloquear acciones
  headquarters = computed(() => this.zones().find(z => z.isHeadquarters) ?? null);


  totalZones = computed(() => this.zones().length);
  // Form reactivo
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    isHeadquarters: [false],
  });

  // UI: abrir/cerrar formulario
  isFormOpen = false;
  toggleForm(){ this.isFormOpen = !this.isFormOpen; }

  // --- Ciclo de vida ---
  ngOnInit() { this.load(); }

  // --- Data fetching ---
  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllZones().subscribe({
      next: (r: ApiResponse<ZoneDTO[]>) => { this.zones.set(r.data ?? []); this.loading.set(false); },
      error: () => { this.error.set(this.t.instant('zones.errorLoad')); this.loading.set(false); }
    });
  }

  // --- Crear / Editar ---
  new() {
    this.editId.set(null);
    this.form.reset({ name: '', description: '', isHeadquarters: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.error.set(null);
  }

  edit(z: ZoneDTO) {
    this.editId.set(z.id);
    this.form.patchValue({
      name: z.name,
      description: z.description ?? '',
      isHeadquarters: !!z.isHeadquarters
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.error.set(null);
  }

  // --- Guardado ---
  save() {
    this.error.set(null);
    const raw = this.form.getRawValue();
    const id = this.editId();

    const name = (raw.name ?? '').trim();
    const payloadCreate = {
      name,
      description: raw.description?.toString().trim() ? raw.description.toString().trim() : undefined,
      isHeadquarters: !!raw.isHeadquarters,
    };
    const payloadUpdate = { ...payloadCreate };

    // CREATE
    if (id == null) {
      this.srv.createZone(payloadCreate).subscribe({
        next: () => { this.new(); this.load(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        error: (e) => this.handleSaveError(e),
      });
      return;
    }

    // UPDATE: valida nombre duplicado antes de persistir
    this.srv.isNameAvailable(name, id).subscribe(isFree => {
      if (!isFree) {
        this.error.set(this.t.instant('zones.form.err.duplicate'));
        const ctrl = this.form.controls['name'];
        ctrl.setErrors({ ...(ctrl.errors ?? {}), duplicateName: true });
        ctrl.markAsTouched();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      this.srv.updateZone(id, payloadUpdate).subscribe({
        next: () => { this.new(); this.load(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        error: (e) => this.handleSaveError(e),
      });
    });
  }

  // Centraliza tratamiento de errores típicos (409/400 + fallback)
  private handleSaveError(e: any) {
    const backendMsg = e?.error?.message?.toString();

    if (e?.status === 409) {
      const msg = backendMsg || this.t.instant('zones.form.err.duplicate');
      this.error.set(msg);
      const ctrl = this.form.controls['name'];
      ctrl.setErrors({ ...(ctrl.errors ?? {}), duplicateName: true });
      ctrl.markAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (e?.status === 400 && backendMsg) {
      this.error.set(backendMsg);
      if (/name/i.test(backendMsg)) {
        const ctrl = this.form.controls['name'];
        ctrl.setErrors({ ...(ctrl.errors ?? {}), required: true });
        ctrl.markAsTouched();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.error.set(backendMsg || this.t.instant('zones.errorSave'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Borrado ---
  delete(z: ZoneDTO) {
    // Bloquea eliminación de la sede central con mensaje i18n
    if (z.isHeadquarters) {
      this.error.set(this.t.instant('zones.err.cannotDeleteHq', { name: z.name }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!confirm(this.t.instant('zones.confirmDelete', { name: z.name }))) return;

    this.loading.set(true);
    this.srv.deleteZone(z.id).subscribe({
      next: () => { this.error.set(null); this.load(); },
      error: () => {
        this.error.set(this.t.instant('zones.errorDelete'));
        this.loading.set(false);
      }
    });
  }
}
