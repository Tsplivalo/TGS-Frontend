// src/app/components/client/client.component.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClientService } from '../../services/client/client';
import { 
  ApiResponse, 
  ClientDTO, 
  CreateClientDTO, 
  UpdateClientDTO 
} from '../../models/client/client.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * ClientComponent
 *
 * Gestión básica de clientes: listado con filtros, alta/edición y borrado.
 * Usa signals para loading/error/lista, form reactivo para validación y i18n para mensajes.
 */

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './client.html',
  styleUrls: ['./client.scss']
})
export class ClientComponent implements OnInit {
  // --- Inyección ---
  private fb = inject(FormBuilder);
  private srv = inject(ClientService);
  private t = inject(TranslateService);

  // --- Estado ---
  loading = signal(false);
  error = signal<string | null>(null);
  clients = signal<ClientDTO[]>([]);
  editDni = signal<string | null>(null);
  isNewOpen = false;

  // --- Filtros ---
  fText = '';
  fPurchases: 'all' | 'yes' | 'no' = 'all';

  // Filtrado reactivo por texto y por historial de compras
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

      const purchases = Array.isArray(c.purchases) ? c.purchases : [];
      const matchPurchases = filter === 'all'
        || (filter === 'yes' && purchases.length > 0)
        || (filter === 'no' && purchases.length === 0);

      return matchText && matchPurchases;
    });
  });

  // --- Form reactivo ---
  form = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(8)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.minLength(1)]],
    phone: ['', [Validators.minLength(6)]],
    username: [''],
    password: ['']
  });

  // --- Ciclo de vida ---
  ngOnInit(): void {
    this.load();
  }

  // --- Data fetching ---
  load() {
    this.loading.set(true);
    this.error.set(null);
    
    this.srv.getAllClients().subscribe({
      next: (r: ApiResponse<ClientDTO[]>) => {
        this.clients.set(r.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('clients.errorLoad');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  // --- UI helpers ---
  toggleNew() {
    this.isNewOpen = !this.isNewOpen;
    if (this.isNewOpen) {
      this.resetForm();
    }
  }

  resetForm() {
    this.editDni.set(null);
    this.form.reset({
      dni: '',
      name: '',
      email: '',
      address: '',
      phone: '',
      username: '',
      password: ''
    });
    // Re-habilitar DNI si estaba deshabilitado
    this.form.get('dni')?.enable();
    this.error.set(null);
  }

  edit(c: ClientDTO) {
    this.editDni.set(c.dni);
    this.form.patchValue({
      dni: c.dni,
      name: c.name,
      email: c.email,
      address: c.address || '',
      phone: c.phone || '',
      username: '',
      password: ''
    });
    
    // Deshabilitar el campo DNI en modo edición
    this.form.get('dni')?.disable();
    
    this.isNewOpen = true;
    this.error.set(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Borrado ---
  delete(dni: string) {
    if (!confirm(this.t.instant('clients.confirmDelete'))) return;
    
    this.loading.set(true);
    this.error.set(null);
    
    this.srv.deleteClient(dni).subscribe({
      next: () => {
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message || this.t.instant('clients.errorDelete');
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }

  // --- Guardado (create/update) ---
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const isEdit = this.editDni() !== null;

    this.loading.set(true);
    this.error.set(null);

    if (isEdit) {
      // Actualizar cliente existente
      const updateData: UpdateClientDTO = {
        name: value.name!.trim(),
        email: value.email!.trim(),
        address: value.address?.trim() || undefined,
        phone: value.phone?.trim() || undefined,
      };

      this.srv.updateClient(this.editDni()!, updateData).subscribe({
        next: () => {
          this.resetForm();
          this.isNewOpen = false;
          this.load();
        },
        error: (err) => {
          const msg = err?.error?.message || this.t.instant('clients.errorSave');
          this.error.set(msg);
          this.loading.set(false);
        }
      });
    } else {
      // Crear nuevo cliente
      const createData: CreateClientDTO = {
        dni: value.dni!.trim(),
        name: value.name!.trim(),
        email: value.email!.trim(),
        address: value.address?.trim() || undefined,
        phone: value.phone?.trim() || undefined,
        username: value.username?.trim() || undefined,
        password: value.password?.trim() || undefined,
      };

      this.srv.createClient(createData).subscribe({
        next: () => {
          this.resetForm();
          this.isNewOpen = false;
          this.load();
        },
        error: (err) => {
          const msg = err?.error?.message || this.t.instant('clients.errorCreate');
          this.error.set(msg);
          this.loading.set(false);
        }
      });
    }
  }

  // --- Validación helpers ---
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return this.t.instant(`clients.errors.${field}Required`);
    }
    if (control.errors['email']) {
      return this.t.instant('clients.errors.emailInvalid');
    }
    if (control.errors['minlength']) {
      const min = control.errors['minlength'].requiredLength;
      return this.t.instant('clients.errors.minLength', { min });
    }
    if (control.errors['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return this.t.instant('clients.errors.maxLength', { max });
    }

    return this.t.instant('clients.errors.invalid');
  }

  // --- Helpers para template ---
  getPurchaseCount(client: ClientDTO): number | string {
    if (!client.purchases) return 0;
    if (typeof client.purchases === 'string') return '—';
    return client.purchases.length;
  }
}