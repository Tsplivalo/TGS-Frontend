import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ClandestineAgreementService } from '../../services/clandestine-agreement/clandestine-agreement';
import {
  ClandestineAgreementDTO,
  CreateClandestineAgreementDTO,
  UpdateClandestineAgreementDTO
} from '../../models/clandestine-agreement/clandestine-agreement.model';

@Component({
  selector: 'app-clandestine-agreement',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './clandestine-agreement.html',
  styleUrls: ['./clandestine-agreement.scss'],
})
export class ClandestineAgreementComponent implements OnInit {
  private fb  = inject(FormBuilder);
  private srv = inject(ClandestineAgreementService);
  private tr  = inject(TranslateService);

  items   = signal<ClandestineAgreementDTO[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);

  isNewOpen = signal(false);
  isEdit    = signal(false);

  fText = signal('');

  form = this.fb.group({
    id:              this.fb.control<number | null>(null),
    shelbyCouncilId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    adminDni:        this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    authorityDni:    this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    agreementDate:   this.fb.control<string | null>(null),
    description:     this.fb.nonNullable.control(''),
    status:          this.fb.control<'ACTIVE'|'COMPLETED'|'CANCELLED'>('ACTIVE'),
  });

  ngOnInit(): void { 
    this.load(); 
  }

  filtered = computed(() => {
    const q = this.fText().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter(it =>
      (it.description?.toLowerCase().includes(q) ?? false) ||
      String(it.id).includes(q) ||
      (it.authority?.name?.toLowerCase().includes(q) ?? false) ||
      (it.authority?.dni?.toLowerCase().includes(q) ?? false) ||
      (it.admin?.name?.toLowerCase().includes(q) ?? false) ||
      (it.admin?.dni?.toLowerCase().includes(q) ?? false) ||
      (it.shelbyCouncil?.id !== undefined && String(it.shelbyCouncil.id).includes(q))
    );
  });

  toggleNew(): void {
    const open = !this.isNewOpen();
    this.isNewOpen.set(open);
    if (!open) this.new();
  }

  new(): void {
    this.isEdit.set(false);
    this.form.reset({
      id: null,
      shelbyCouncilId: null,
      adminDni: '',
      authorityDni: '',
      agreementDate: null,
      description: '',
      status: 'ACTIVE'
    });
  }

  edit(it: ClandestineAgreementDTO): void {
    this.isEdit.set(true);
    this.form.patchValue({
      id: it.id,
      shelbyCouncilId: it.shelbyCouncil?.id ?? null,
      adminDni: it.admin?.dni ?? '',
      authorityDni: it.authority?.dni ?? '',
      agreementDate: it.agreementDate?.substring(0,10) ?? null,
      description: it.description ?? '',
      status: it.status,
    });
    this.isNewOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      return; 
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    const { id, ...rest } = this.form.getRawValue();

    if (!this.isEdit()) {
      // CREAR NUEVO ACUERDO
      const payload: CreateClandestineAgreementDTO = {
        shelbyCouncilId: rest.shelbyCouncilId!,
        adminDni: rest.adminDni,
        authorityDni: rest.authorityDni,
        agreementDate: rest.agreementDate || undefined,
        description: rest.description || undefined,
        status: rest.status || 'ACTIVE',
      };
      
      this.srv.create(payload).subscribe({
        next: () => { 
          this.new(); 
          this.isNewOpen.set(false); 
          this.load(); 
        },
        error: (e) => { 
          this.error.set(e?.error?.message ?? 'Error creando acuerdo'); 
          this.loading.set(false); 
        }
      });
    } else {
      // ACTUALIZAR ACUERDO EXISTENTE
      // Solo enviamos los campos que se pueden actualizar
      const payload: UpdateClandestineAgreementDTO = {
        agreementDate: rest.agreementDate || undefined,
        description: rest.description || undefined,
        status: rest.status || undefined,
      };
      
      this.srv.update(id!, payload).subscribe({
        next: () => { 
          this.new(); 
          this.isNewOpen.set(false); 
          this.load(); 
        },
        error: (e) => { 
          this.error.set(e?.error?.message ?? 'Error actualizando acuerdo'); 
          this.loading.set(false); 
        }
      });
    }
  }

  delete(it: ClandestineAgreementDTO): void {
    const msg = this.tr.instant('clandestineAgreement.confirmDelete') || '¿Eliminar este acuerdo clandestino?';
    if (!confirm(msg)) return;
    
    this.loading.set(true);
    this.srv.delete(it.id).subscribe({ 
      next: () => this.load(),
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Error eliminando');
        this.loading.set(false);
      }
    });
  }

  trackById = (_: number, it: ClandestineAgreementDTO) => it.id;

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.srv.list().subscribe({
      next: (res) => { 
        this.items.set(res.data ?? []); 
        this.loading.set(false); 
      },
      error: (e) => { 
        this.error.set(e?.error?.message ?? 'Error cargando acuerdos'); 
        this.loading.set(false); 
      }
    });
  }
}