import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

// Servicios
import { ClandestineAgreementService } from '../../services/clandestine-agreement/clandestine-agreement';
import { AuthorityService } from '../../services/authority/authority';
import { AdminService } from '../../services/admin/admin';
import { ShelbyCouncilService } from '../../services/shelby-council/shelby-council';

// Modelos
import {
  ClandestineAgreementDTO,
  CreateClandestineAgreementDTO,
  UpdateClandestineAgreementDTO
} from '../../models/clandestine-agreement/clandestine-agreement.model';
import { AuthorityDTO } from '../../models/authority/authority.model';
import { AdminDTO } from '../../models/admin/admin.model';
import { ShelbyCouncilDTO } from '../../models/shelby-council/shelby-council.model';

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
  private authSrv = inject(AuthorityService);
  private adminSrv = inject(AdminService);
  private councilSrv = inject(ShelbyCouncilService);
  private tr  = inject(TranslateService);

  // Estado
  items   = signal<ClandestineAgreementDTO[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);

  isNewOpen = signal(false);
  isEdit    = signal(false);

  fText = signal('');

  //  Datos reales desde la API
  authorities = signal<AuthorityDTO[]>([]);
  admins = signal<AdminDTO[]>([]);
  councils = signal<ShelbyCouncilDTO[]>([]);

  form = this.fb.group({
    id:              this.fb.control<number | null>(null),
    shelbyCouncilId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    adminDni:        this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
    authorityDni:    this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
    agreementDate:   this.fb.control<string | null>(null),
    description:     this.fb.control<string>(''),
    status:          this.fb.control<'ACTIVE'|'COMPLETED'|'CANCELLED'>('ACTIVE'),
  });

  ngOnInit(): void { 
    this.loadAll(); 
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
    this.isNewOpen.set(true);
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
      // ✅ Convertir fecha YYYY-MM-DD a ISO datetime
      let agreementDateISO: string | undefined;
      if (rest.agreementDate) {
        agreementDateISO = new Date(rest.agreementDate + 'T00:00:00.000Z').toISOString();
      }

      const payload: CreateClandestineAgreementDTO = {
        shelbyCouncilId: rest.shelbyCouncilId!,
        adminDni: rest.adminDni!,
        authorityDni: rest.authorityDni!,
        agreementDate: agreementDateISO,
        description: rest.description || undefined,
        status: rest.status || 'ACTIVE',
      };
      
      this.srv.create(payload).subscribe({
        next: () => { 
          this.new(); 
          this.isNewOpen.set(false); 
          this.loadAll(); 
        },
        error: (e) => { 
          this.error.set(e?.error?.message ?? 'Error creando acuerdo'); 
          this.loading.set(false); 
        }
      });
    } else {
      // ACTUALIZAR ACUERDO EXISTENTE
      // ✅ Convertir fecha YYYY-MM-DD a ISO datetime
      let agreementDateISO: string | undefined;
      if (rest.agreementDate) {
        agreementDateISO = new Date(rest.agreementDate + 'T00:00:00.000Z').toISOString();
      }

      const payload: UpdateClandestineAgreementDTO = {
        agreementDate: agreementDateISO,
        description: rest.description || undefined,
        status: rest.status || undefined,
      };
      
      this.srv.update(id!, payload).subscribe({
        next: () => { 
          this.new(); 
          this.isNewOpen.set(false); 
          this.loadAll(); 
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
      next: () => this.loadAll(),
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Error eliminando');
        this.loading.set(false);
      }
    });
  }

  trackById = (_: number, it: ClandestineAgreementDTO) => it.id;

  /**
   * ✅ Carga paralela de TODOS los datos necesarios
   * - Acuerdos clandestinos
   * - Autoridades
   * - Administradores
   * - Consejos Shelby
   */
  private loadAll(): void {
    this.loading.set(true);
    this.error.set(null);
    
    forkJoin({
      agreements: this.srv.list(),
      authorities: this.authSrv.getAllAuthorities(),
      admins: this.adminSrv.list(),
      councils: this.councilSrv.list()
    }).subscribe({
      next: (res) => { 
        this.items.set(res.agreements.data ?? []); 
        this.authorities.set(res.authorities.data ?? []);
        this.admins.set(res.admins.data ?? []);
        this.councils.set(res.councils.data ?? []);
        this.loading.set(false); 
      },
      error: (e) => { 
        this.error.set(e?.error?.message ?? 'Error cargando datos'); 
        this.loading.set(false); 
      }
    });
  }
}