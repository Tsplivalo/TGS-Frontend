import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ShelbyCouncilService } from '../../services/shelby-council/shelby-council';
import {
  ShelbyCouncilDTO,
  CreateShelbyCouncilDTO,
  PatchShelbyCouncilDTO
} from '../../models/shelby-council/shelby-council.model';

@Component({
  selector: 'app-shelby-council',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './shelby-council.html',
  styleUrls: ['./shelby-council.scss'],
})
export class ShelbyCouncilComponent implements OnInit {
  private fb  = inject(FormBuilder);
  private srv = inject(ShelbyCouncilService);
  private tr  = inject(TranslateService);

  // Estado
  items   = signal<ShelbyCouncilDTO[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);
  isNewOpen = signal(false);
  isEdit    = signal(false);

  // Filtros
  fText = signal<string>('');
  fPartnerDni = signal<string>('');
  fDecisionId = signal<number | null>(null);

  // Formulario
  form = this.fb.group({
    id: this.fb.control<number | null>(null),
    partnerDni: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    decisionId: this.fb.nonNullable.control<number | null>(null, [Validators.required]),
    joinDate: this.fb.control<string | null>(this.todayISO()),
    role: this.fb.control<string | null>(null),
    notes: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.load();
  }

  // Lista filtrada por texto local
  filtered = computed(() => {
    const q = this.fText().toLowerCase().trim();
    if (!q) return this.items();

    return this.items().filter(it => {
      const searchText = [
        it.id,
        it.partner?.dni,
        it.partner?.name,
        it.decision?.id,
        it.decision?.description,
        it.role,
      ].join(' ').toLowerCase();
      
      return searchText.includes(q);
    });
  });

  // UI Actions
  toggleNew(): void {
    const open = !this.isNewOpen();
    this.isNewOpen.set(open);
    if (!open) this.new();
  }

  new(): void {
    this.isEdit.set(false);
    this.form.reset({
      id: null,
      partnerDni: '',
      decisionId: null,
      joinDate: this.todayISO(),
      role: null,
      notes: null,
    });
  }

  edit(it: ShelbyCouncilDTO): void {
    this.isEdit.set(true);
    
    // Convertir ISO datetime a date para el input
    const joinDate = it.joinDate ? it.joinDate.substring(0, 10) : this.todayISO().substring(0, 10);
    
    this.form.patchValue({
      id: it.id,
      partnerDni: (it.partner?.dni ?? ''),
      decisionId: (it.decision?.id ?? null),
      joinDate: joinDate,
      role: (it.role ?? null),
      notes: (it.notes ?? null),
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
      // CREAR - convertir date a ISO datetime
      const payload: CreateShelbyCouncilDTO = {
        partnerDni: rest.partnerDni,
        decisionId: rest.decisionId!,
        joinDate: rest.joinDate ? this.toISODateTime(rest.joinDate) : undefined,
        role: rest.role ?? undefined,
        notes: rest.notes ?? undefined,
      };

      this.srv.create(payload).subscribe({
        next: () => {
          this.new();
          this.isNewOpen.set(false);
          this.load();
        },
        error: (e) => {
          const errorMsg = (e?.error?.message ?? this.tr.instant('shelbyCouncil.errorCreate')) || 'Error al crear';
          this.error.set(errorMsg);
          this.loading.set(false);
        }
      });
    } else {
      // ACTUALIZAR
      const payload: PatchShelbyCouncilDTO = {
        joinDate: rest.joinDate ? this.toISODateTime(rest.joinDate) : undefined,
        role: rest.role ?? undefined,
        notes: rest.notes ?? undefined,
      };

      this.srv.update(id!, payload).subscribe({
        next: () => {
          this.new();
          this.isNewOpen.set(false);
          this.load();
        },
        error: (e) => {
          const errorMsg = (e?.error?.message ?? this.tr.instant('shelbyCouncil.errorSave')) || 'Error al guardar';
          this.error.set(errorMsg);
          this.loading.set(false);
        }
      });
    }
  }

  delete(it: ShelbyCouncilDTO): void {
    const msg = this.tr.instant('shelbyCouncil.confirmDelete') || '¿Eliminar registro?';
    if (!confirm(msg)) return;

    this.loading.set(true);
    this.srv.delete(it.id).subscribe({
      next: () => { 
        this.load(); 
      },
      error: (e) => {
        const errorMsg = (e?.error?.message ?? this.tr.instant('shelbyCouncil.errorDelete')) || 'No se pudo eliminar.';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  trackById = (_: number, it: ShelbyCouncilDTO) => it.id;

  // Carga de datos - usa el endpoint correcto con paginación
  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    // Usamos limit alto para traer todos los registros (o implementar paginación real)
    this.srv.list({ limit: 1000 }).subscribe({
      next: (res) => { 
        this.items.set(res.data ?? []); 
        this.loading.set(false); 
      },
      error: (e) => {
        const errorMsg = (e?.error?.message ?? this.tr.instant('shelbyCouncil.errorLoad')) || 'Error al cargar';
        this.error.set(errorMsg);
        this.loading.set(false);
      }
    });
  }

  // Helper: fecha ISO actual (YYYY-MM-DD)
  private todayISO(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  // Helper: convertir fecha YYYY-MM-DD a ISO datetime
  private toISODateTime(dateStr: string): string {
    // Si ya es ISO completo, retornar
    if (dateStr.includes('T')) return dateStr;
    
    // Agregar hora por defecto (10:00:00)
    return `${dateStr}T10:00:00Z`;
  }
}