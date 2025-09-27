import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, Validators, FormGroup, FormControl
} from '@angular/forms';
import {
  TematicaService
} from '../../services/tematica/tematica';
import {
  TematicaDTO,
  CreateTematicaDTO,
  UpdateTematicaDTO,
  ApiResponse
} from '../../models/tematica/tematica.model';

type TematicaForm = {
  id: FormControl<number | null>;
  descripcion: FormControl<string>;
};

@Component({
  selector: 'app-tematica',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tematica.html',
  styleUrls: ['./tematica.scss'],
})
export class TematicaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(TematicaService);

  tematicas = signal<TematicaDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  submitted = signal(false);

  // edición
  isEdit = signal(false);

  // filtro simple
  fTexto = '';

  form: FormGroup<TematicaForm> = this.fb.group<TematicaForm>({
    id: this.fb.control<number | null>(null),
    descripcion: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(1)] }),
  });

  ngOnInit(): void {
    this.cargar();
  }

  tematicasFiltradas = computed(() => {
    const q = (this.fTexto || '').toLowerCase().trim();
    if (!q) return this.tematicas();
    return this.tematicas().filter(t => (t.descripcion || '').toLowerCase().includes(q) || String(t.id).includes(q));
  });

  cargar() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (res: ApiResponse<TematicaDTO[]>) => {
        this.tematicas.set(res?.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudieron cargar las temáticas.');
        this.loading.set(false);
      }
    });
  }

  nuevo() {
    this.isEdit.set(false);
    this.form.reset({ id: null, descripcion: '' });
    this.submitted.set(false);
  }

  editar(t: TematicaDTO) {
    this.isEdit.set(true);
    this.form.setValue({ id: t.id, descripcion: t.descripcion || '' });
    this.submitted.set(false);
  }

  eliminar(id: number) {
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo eliminar.');
        this.loading.set(false);
      }
    });
  }

  private buildCreate(): CreateTematicaDTO {
    return { descripcion: String(this.form.controls.descripcion.value || '').trim() };
  }

  private buildUpdate(): UpdateTematicaDTO {
    return { descripcion: String(this.form.controls.descripcion.value || '').trim() || undefined };
  }

  guardar() {
    this.submitted.set(true);

    if (this.form.controls.descripcion.invalid) {
      this.form.controls.descripcion.markAsTouched();
      this.error.set('Completá la descripción.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (!this.isEdit()) {
      this.srv.create(this.buildCreate()).subscribe({
        next: () => { this.nuevo(); this.cargar(); },
        error: (err) => {
          this.error.set(err?.error?.message || 'No se pudo crear.');
          this.loading.set(false);
        }
      });
      return;
    }

    const id = this.form.controls.id.value!;
    this.srv.update(id, this.buildUpdate()).subscribe({
      next: () => { this.nuevo(); this.cargar(); },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo guardar.');
        this.loading.set(false);
      }
    });
  }
}
