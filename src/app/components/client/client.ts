// src/app/components/client/client.component.ts
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClientService } from '../../services/client/client';
import { SaleService } from '../../services/sale/sale';
import { 
  ApiResponse, 
  ClientDTO, 
  CreateClientDTO, 
  UpdateClientDTO
} from '../../models/client/client.model';
import { SaleDTO } from '../../models/sale/sale.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './client.html',
  styleUrls: ['./client.scss']
})
export class ClientComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(ClientService);
  private saleSrv = inject(SaleService);
  private t = inject(TranslateService);

  loading = signal(false);
  error = signal<string | null>(null);
  clients = signal<ClientDTO[]>([]);
  sales = signal<SaleDTO[]>([]);
  editDni = signal<string | null>(null);
  isNewOpen = false;

  fTextInput = signal('');
  fTextApplied = signal('');
  fPurchasesInput = signal<'all' | 'yes' | 'no'>('all');
  fPurchasesApplied = signal<'all' | 'yes' | 'no'>('all');

  // ✅ Mapa de compras por cliente DNI
  purchasesByClient = computed(() => {
    const map = new Map<string, number>();
    this.sales().forEach(sale => {
      // ✅ El sale tiene 'client.dni', no 'clientDni'
      const clientDni = sale.client?.dni;
      if (clientDni) {
        const current = map.get(clientDni) || 0;
        map.set(clientDni, current + 1);
      }
    });
    return map;
  });

  totalClients = computed(() => this.clients().length);
  
  clientsWithPurchases = computed(() => {
    const purchasesMap = this.purchasesByClient();
    return this.clients().filter(c => (purchasesMap.get(c.dni) || 0) > 0).length;
  });
  
  clientsWithoutPurchases = computed(() => {
    const purchasesMap = this.purchasesByClient();
    return this.clients().filter(c => (purchasesMap.get(c.dni) || 0) === 0).length;
  });

  filteredClients = computed(() => {
    const txt = this.fTextApplied().toLowerCase().trim();
    const filter = this.fPurchasesApplied();
    const purchasesMap = this.purchasesByClient();

    return this.clients().filter(c => {
      const matchText = !txt
        || c.dni.toLowerCase().includes(txt)
        || c.name.toLowerCase().includes(txt)
        || (c.email ?? '').toLowerCase().includes(txt)
        || (c.address ?? '').toLowerCase().includes(txt)
        || (c.phone ?? '').toLowerCase().includes(txt);

      const purchaseCount = purchasesMap.get(c.dni) || 0;
      const matchPurchases = filter === 'all'
        || (filter === 'yes' && purchaseCount > 0)
        || (filter === 'no' && purchaseCount === 0);

      return matchText && matchPurchases;
    });
  });

  applyFilters() {
    this.fTextApplied.set(this.fTextInput());
    this.fPurchasesApplied.set(this.fPurchasesInput());
  }

  clearFilters() {
    this.fTextInput.set('');
    this.fPurchasesInput.set('all');
    this.fTextApplied.set('');
    this.fPurchasesApplied.set('all');
  }

  form = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(8)]],
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    address: [''],
    phone: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    
    // ✅ Cargar clientes Y ventas en paralelo
    Promise.all([
      this.srv.getAllClients().toPromise(),
      this.saleSrv.getAllSales().toPromise()
    ]).then(([clientsRes, sales]) => {
      this.clients.set(clientsRes?.data ?? []);
      this.sales.set(sales ?? []);
      this.loading.set(false);
    }).catch((err) => {
      const msg = err?.error?.message || this.t.instant('clients.errorLoad');
      this.error.set(msg);
      this.loading.set(false);
    });
  }

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
      phone: ''
    });
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
      phone: c.phone || ''
    });
    
    this.form.get('dni')?.disable();
    this.isNewOpen = true;
    this.error.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
      const createData: CreateClientDTO = {
        dni: value.dni!.trim(),
        name: value.name!.trim(),
        email: value.email!.trim(),
        address: value.address?.trim() || undefined,
        phone: value.phone?.trim() || undefined
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

  // ✅ Obtener cantidad de compras desde el mapa
  getPurchaseCount(client: ClientDTO): number {
    return this.purchasesByClient().get(client.dni) || 0;
  }

  // ✅ Verificar si tiene compras
  hasPurchases(client: ClientDTO): boolean {
    return (this.purchasesByClient().get(client.dni) || 0) > 0;
  }
}