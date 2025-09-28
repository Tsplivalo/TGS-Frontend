import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SocioService } from '../../services/socio/socio.js';
import { SocioDTO, SocioStatus } from '../../models/socio/socio.model.js';

@Component({
  standalone: true,
  selector: 'app-socios',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './socio.html',
  styleUrls: ['./socio.scss'],
})
export class SocioComponent {
  private fb = inject(FormBuilder);
  private srv = inject(SocioService);

  nuevoAbierto = false;
  toggleNuevo(){ this.nuevoAbierto = !this.nuevoAbierto; }


  socios: SocioDTO[] = [];
  query = '';

  // para crear/editar
  selected: SocioDTO | null = null;
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: [''],
    phone: [''],
    status: this.fb.nonNullable.control<SocioStatus>('active'),
  });
/*
  constructor() { this.load(); }

  async load() {
    const res = await this.srv.list(this.query);
    this.socios = res.data ?? [];
  }

  async onSearch() { await this.load(); }

  newSocio() {
    this.selected = null;
    this.form.reset({ name: '', email: '', phone: '', status: 'active' });
  }

  editSocio(s: Socio) {
    this.selected = s;
    this.form.reset({
      name: s.name ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      status: s.status ?? 'active',
    });
  }

  async save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload = this.form.getRawValue();
    if (this.selected?.id) await this.srv.update(this.selected.id, payload);
    else await this.srv.create(payload);
    await this.load();
    this.cancel();
  }

  async toggleStatus(s: Socio) {
    const next: SocioStatus = s.status === 'active' ? 'inactive' : 'active';
    await this.srv.patchStatus(s.id!, next);
    await this.load();
  }

  async remove(s: Socio) {
    if (!s.id) return;
    if (!confirm(Eliminar socio "${s.name}"?)) return;
    await this.srv.remove(s.id);
    await this.load();
  }

  cancel() { this.selected = null; }
}

*/}

