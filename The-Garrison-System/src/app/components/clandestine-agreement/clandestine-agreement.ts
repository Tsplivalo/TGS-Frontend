import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ClandestineAgreementService } from '../../services/clandestine-agreement/clandestine-agreement';
import {
  ClandestineAgreementDTO,
  CreateClandestineAgreementDTO,
  PatchClandestineAgreementDTO
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
  private tr  = inject(TranslateService); // ← para confirm opcional

  items   = signal<ClandestineAgreementDTO[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);

  isNewOpen = signal(false);
  isEdit    = signal(false);

  fText = signal('');

  form = this.fb.group({
    id:              this.fb.control<number | null>(null),
    shelbyCouncilId: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    authorityDni:    this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    agreementDate:   this.fb.control<string | null>(null, [Validators.required]),
    description:     this.fb.nonNullable.control('', [Validators.required]),
    status:          this.fb.control<'PENDING'|'ACTIVE'|'EXPIRED'|'CANCELLED' | null>('PENDING'),
  });

  ngOnInit(): void { this.load(); }

  filtered = computed(() => {
    const q = this.fText().toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter(it =>
      (it.description?.toLowerCase().includes(q) ?? false) ||
      String(it.id).includes(q) ||
      (it.authority?.name?.toLowerCase().includes(q) ?? false) ||
      (it.authority?.dni?.toLowerCase().includes(q) ?? false) ||
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
      authorityDni: '',
      agreementDate: null,
      description: '',
      status: 'PENDING'
    });
  }

  edit(it: ClandestineAgreementDTO): void {
    this.isEdit.set(true);
    this.form.patchValue({
      id: it.id,
      shelbyCouncilId: it.shelbyCouncil?.id ?? null,
      authorityDni: it.authority?.dni ?? '',
      agreementDate: it.agreementDate?.substring(0,10) ?? null,
      description: it.description ?? '',
      status: it.status,
    });
    this.isNewOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { id, ...rest } = this.form.getRawValue();

    if (!this.isEdit()) {
      const payload = rest as CreateClandestineAgreementDTO;
      this.srv.create(payload).subscribe({
        next: () => { this.new(); this.isNewOpen.set(false); this.load(); },
        error: (e) => { this.error.set(e?.error?.message ?? 'Error creando'); this.loading.set(false); }
      });
    } else {
      const payload = rest as PatchClandestineAgreementDTO;
      this.srv.update(id!, payload).subscribe({
        next: () => { this.new(); this.isNewOpen.set(false); this.load(); },
        error: (e) => { this.error.set(e?.error?.message ?? 'Error guardando'); this.loading.set(false); }
      });
    }
  }

  delete(it: ClandestineAgreementDTO): void {
    const msg = this.tr.instant('common.delete') || 'Eliminar';
    if (!confirm(`${msg} ¿acuerdo?`)) return; // usa traducción si existe, sino fallback
    this.srv.delete(it.id).subscribe({ next: () => this.load() });
  }

  trackById = (_: number, it: ClandestineAgreementDTO) => it.id;

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.srv.list().subscribe({
      next: (list) => {                 // list es un arreglo ya normalizado por el service
        this.items.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Error cargando');
        this.loading.set(false);
      }
    });
  }

}
