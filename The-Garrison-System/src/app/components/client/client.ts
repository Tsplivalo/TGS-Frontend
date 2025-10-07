import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClientService } from '../../services/client/client';
import { ApiResponse, ClientDTO } from '../../models/client/client.model';
import { NgFor } from '@angular/common';


@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgFor],
  templateUrl: './client.html',
  styleUrls: ['./client.scss']
})
export class ClientComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(ClientService);

  loading = signal(false);
  error   = signal<string | null>(null);

  clients = signal<ClientDTO[]>([]);
  editDni  = signal<string | null>(null);

  fText = '';
  fPurchases: 'all' | 'yes' | 'no' = 'all';

  filteredClients = computed(() => {
    const txt = (this.fText || '').toLowerCase().trim();
    const filter = this.fPurchases;

    return this.clients().filter(c => {
      const matchText = !txt
        || c.dni.toLowerCase().includes(txt)
        || c.name.toLowerCase().includes(txt)
        || (c.email ?? '').toLowerCase().includes(txt)
        || (c.address ?? '').toLowerCase().includes(txt)
        || (c.phone ?? '').toLowerCase().includes(txt);

      const quantity = c.purchaseHistory?.length ?? 0;
      const matchPurchases = filter === 'all'
        || (filter === 'yes' && quantity > 0)
        || (filter === 'no' && quantity === 0);

      return matchText && matchPurchases;
    });
  });

  form = this.fb.group({
    dni:        ['', [Validators.required, Validators.minLength(6)]],
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:      ['', [Validators.email]],
    address:  [''],
    phone:   [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllClients().subscribe({
      next: (r: ApiResponse<ClientDTO[]>) => {
        this.clients.set(r.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load clients.');
        this.loading.set(false);
      }
    });
  }

  new() {
    this.editDni.set(null);
  this.form.reset({ dni: '', name: '', email: '', address: '', phone: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  isNewOpen = false;
  toggleNew(){ this.isNewOpen = !this.isNewOpen; }

  edit(c: ClientDTO) {
    this.editDni.set(c.dni);
    this.form.patchValue({
      dni: c.dni,
      name: c.name,
      email: c.email ?? '',
      address: c.address ?? '',
      phone: c.phone ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  delete(dni: string) {
    if (!confirm('Delete this client?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteClient(dni).subscribe({
      next: () => this.load(),
      error: () => { this.error.set('Could not delete.'); this.loading.set(false); }
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const body: ClientDTO = {
      dni: value.dni!.trim(),
      name: value.name!.trim(),
      email: (value.email ?? '').trim() || undefined,
      address: (value.address ?? '').trim() || undefined,
      phone: (value.phone ?? '').trim() || undefined,
      purchaseHistory: []
    };

    this.loading.set(true);
    this.error.set(null);

    const isEdit = this.editDni() !== null;
    const req$ = isEdit
      ? this.srv.updateClient(this.editDni()!, body)
      : this.srv.createClient(body);

    req$.subscribe({
      next: () => {
        this.new();
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message || (isEdit
          ? 'Could not save.'
          : 'Could not create.');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
