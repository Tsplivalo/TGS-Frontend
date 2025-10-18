import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PartnerService } from '../../services/partner/partner';
import { ClientService } from '../../services/client/client';

import {
  PartnerDTO,
  CreatePartnerDTO,
  PatchPartnerDTO,
  PartnerDecisionRefDTO
} from '../../models/partner/partner.model';
import { ClientDTO } from '../../models/client/client.model';

type Mode = 'fromClient' | 'manual';

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './partner.html',
  styleUrls: ['./partner.scss']
})
export class PartnerComponent implements OnInit {
  // Servicios
  private tr = inject(TranslateService);
  private fb = inject(FormBuilder);
  private srv = inject(PartnerService);
  private clientsSrv = inject(ClientService);

  // Estado base
  items = signal<PartnerDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filtros / UI
  fTextInput = signal('');
  fTextApplied = signal('');
  isNewOpen = signal(false);
  isEdit = signal(false);

  // Modo de creación
  mode = signal<Mode>('fromClient');

  // Clientes (selector)
  clients = signal<ClientDTO[]>([]);
  clientSearch = signal<string>('');
  selectedClientDni = signal<string | null>(null);

  filteredClients = computed(() => {
    const q = this.clientSearch().toLowerCase().trim();
    const arr = this.clients();
    if (!q) return arr;
    return arr.filter(c =>
      c.dni.toLowerCase().includes(q) ||
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  // Listado filtrado de socios
  filteredPartners = computed(() => {
    const q = this.fTextApplied().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter(it =>
      it.dni.toLowerCase().includes(q) ||
      (it.name ?? '').toLowerCase().includes(q) ||
      (it.email ?? '').toLowerCase().includes(q) ||
      (it.phone ?? '').toLowerCase().includes(q) ||
      (it.address ?? '').toLowerCase().includes(q) ||
      (it.decisions ?? []).some(d => (String(d.id).includes(q) || (d.description ?? '').toLowerCase().includes(q)))
    );
  });

  // Formulario
  form = this.fb.group({
    dni:       this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    name:      this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email:     this.fb.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    address:   this.fb.control<string>('', { nonNullable: false }),
    phone:     this.fb.control<string>('', { nonNullable: false }),

    // Credenciales (solo modo MANUAL)
    createCreds: this.fb.control<boolean>(false, { nonNullable: true }),
    username:  this.fb.control<string>('', { nonNullable: true }),
    password:  this.fb.control<string>('', { nonNullable: true }),
  });

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
    if (mode === 'fromClient') {
      // Forzar oculto y limpio
      this.form.patchValue({ createCreds: false, username: '', password: '' });
      this.toggleCredsValidators(false);
    } else {
      // Modo manual: respetar toggle actual
      const create = !!this.form.controls.createCreds.value;
      this.toggleCredsValidators(create);
    }
  }

  // === NEW: handler de toggle en template ===
  onCredsToggle(ev: Event) {
    const checked = !!(ev.target as HTMLInputElement).checked;
    this.form.controls.createCreds.setValue(checked);
    this.toggleCredsValidators(checked);
  }

  // ciclo de vida
  ngOnInit(): void {
    this.load();
    this.loadClients();
    this.applyCredsAvailabilityByMode(this.mode());
  }

  // data
  private load(): void {
    this.loading.set(true);
    const q = this.fTextApplied().trim() || undefined;
    this.srv.list({ q }).subscribe({
      next: (res) => { this.items.set(res.data ?? []); this.loading.set(false); },
      error: (e)  => {
        this.error.set(e?.error?.message ?? this.tr.instant('partner.errorLoad'));
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
  this.fTextApplied.set(this.fTextInput());
  this.load(); // Recarga con el nuevo filtro
  }

  clearFilters() {
    this.fTextInput.set('');
    this.fTextApplied.set('');
    this.load();
  }

  totalPartners = computed(() => this.items().length);
  partnersWithDecisions = computed(() => 
    this.items().filter(p => p.decisions && p.decisions.length > 0).length
  );

  private loadClients(): void {
    this.clientsSrv.getAllClients().subscribe({
      next: (res) => { this.clients.set((res as any)?.data ?? (res as any) ?? []); },
      error: () => { /* no bloquea el alta */ }
    });
  }

  // UI
  toggleNew() {
    const open = !this.isNewOpen();
    this.isNewOpen.set(open);
    if (open) this.new();
  }

  new() {
    this.isEdit.set(false);
    this.mode.set('fromClient');
    this.selectedClientDni.set(null);
    this.clientSearch.set('');
    this.form.reset({
      dni: '', name: '', email: '', address: '', phone: '',
      createCreds: false, username: '', password: ''
    });
    this.applyCredsAvailabilityByMode('fromClient');
  }

  edit(p: PartnerDTO) {
    this.isEdit.set(true);
    this.isNewOpen.set(true);
    this.mode.set('manual'); // al editar, manual
    this.form.reset({
      dni: p.dni,
      name: p.name ?? '',
      email: p.email ?? '',
      address: p.address ?? '',
      phone: p.phone ?? '',
      createCreds: false,
      username: '',
      password: ''
    });
    this.applyCredsAvailabilityByMode('manual');
  }

  onModeChange(ev: Event) {
    const val = (ev.target as HTMLInputElement).value as Mode;
    this.mode.set(val);
    this.applyCredsAvailabilityByMode(val);
    if (val === 'manual') {
      this.selectedClientDni.set(null);
    }
  }

  onSelectClient(ev: Event) {
    const dni = (ev.target as HTMLSelectElement).value || '';
    if (!dni) {
      this.selectedClientDni.set(null);
      return;
    }
    this.selectedClientDni.set(dni);
    const c = this.clients().find(x => x.dni === dni);
    if (c) {
      this.form.patchValue({
        dni: c.dni,
        name: c.name ?? '',
        email: c.email ?? '',
        address: c.address ?? '',
        phone: c.phone ?? ''
      });
    }
  }

  // Guardar
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    const isManual = this.mode() === 'manual';
    const wantCreds = isManual && !!v.createCreds;

    const payload: CreatePartnerDTO = {
      dni: (v.dni || '').trim(),
      name: (v.name || '').trim(),
      email: (v.email || '').trim(),
      address: (v.address || '').trim() || null,
      phone: (v.phone || '').trim() || null,
      ...(wantCreds ? {
        username: (v.username || '').trim(),
        password: (v.password || '').trim(),
      } : {})
    };

    if (!this.isEdit()) {
      // CREATE
      this.srv.create(payload).subscribe({
        next: () => { this.new(); this.load(); this.loading.set(false); },
        error: (e) => {
          this.error.set(e?.error?.message ?? this.tr.instant('partner.errorCreate'));
          this.loading.set(false);
        }
      });
    } else {
      // EDIT / PATCH
      const patch: PatchPartnerDTO = {
        name: payload.name,
        email: payload.email,
        address: payload.address ?? undefined,
        phone: payload.phone ?? undefined
      };
      this.srv.update(this.form.controls.dni.value, patch).subscribe({
        next: () => { this.new(); this.load(); this.loading.set(false); },
        error: (e) => {
          this.error.set(e?.error?.message ?? this.tr.instant('partner.errorUpdate'));
          this.loading.set(false);
        }
      });
    }
  }

  delete(p: PartnerDTO) {
    if (!p?.dni) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(p.dni).subscribe({
      next: () => { this.load(); },
      error: (e) => {
        this.error.set(e?.error?.message ?? this.tr.instant('partner.errorDelete'));
        this.loading.set(false);
      }
    });
  }
}
