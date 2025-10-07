import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PartnerService } from '../../services/partner/partner.js';
import { PartnerDTO, PartnerStatus } from '../../models/partner/partner.model.js';

@Component({
  standalone: true,
  selector: 'app-partners',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './partner.html',
  styleUrls: ['./partner.scss'],
})
export class PartnerComponent {
  private fb = inject(FormBuilder);
  private srv = inject(PartnerService);

  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }


  partners: PartnerDTO[] = [];
  query = '';

  // para crear/editar
  selected: PartnerDTO | null = null;
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: [''],
    phone: [''],
    status: this.fb.nonNullable.control<PartnerStatus>('active'),
  });
/*
  constructor() { this.load(); }

  async load() {
    const res = await this.srv.list(this.query);
    this.partners = res.data ?? [];
  }

  async onSearch() { await this.load(); }

  newPartner() {
    this.selected = null;
    this.form.reset({ name: '', email: '', phone: '', status: 'active' });
  }

  editPartner(s: Partner) {
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

  async toggleStatus(s: Partner) {
    const next: PartnerStatus = s.status === 'active' ? 'inactive' : 'active';
    await this.srv.patchStatus(s.id!, next);
    await this.load();
  }

  async remove(s: Partner) {
    if (!s.id) return;
    if (!confirm(Delete partner "${s.name}"?)) return;
    await this.srv.remove(s.id);
    await this.load();
  }

  cancel() { this.selected = null; }
}

*/}
