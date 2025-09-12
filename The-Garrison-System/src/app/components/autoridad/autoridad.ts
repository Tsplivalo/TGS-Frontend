import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AutoridadService } from '../../services/autoridad/autoridad';

// 👇 Usa TUS modelos (no declares interfaces locales)
import {
  AutoridadDTO,            // del modelo
  CreateAutoridadDTO,      // del modelo
  UpdateAutoridadDTO,      // del modelo (si no existe, podés usar CreateAutoridadDTO)
  ApiResponse
} from '../../models/autoridad/autoridad.model';

@Component({
  selector: 'app-autoridad',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './autoridad.html',
  styleUrls: ['./autoridad.scss']
})
export class AutoridadComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(AutoridadService);

  // estado
  loading = signal(false);
  error   = signal<string | null>(null);
  editId  = signal<number | null>(null);

  // datos
  autoridades = signal<AutoridadDTO[]>([]);

  // filtros
  fTexto = signal('');
  fRango = signal('');

  // lista filtrada (solo uso props que existen en tu modelo)
  listaFiltrada = computed(() => {
    const txt = this.fTexto().toLowerCase().trim();
    const rng = this.fRango().toLowerCase().trim();

    return (this.autoridades() ?? []).filter(a => {
      const nombre = a.usuario?.nombre?.toLowerCase() ?? '';
      const dni    = a.usuario?.dni?.toLowerCase() ?? '';
      const email  = a.usuario?.email?.toLowerCase() ?? '';
      const zona   = a.zona?.nombre?.toLowerCase() ?? String(a.zona?.id ?? '');
      const rango  = (a.rango ?? '').toLowerCase();

      const matchTxt = !txt || nombre.includes(txt) || dni.includes(txt) || email.includes(txt) || zona.includes(txt);
      const matchRng = !rng || rango.includes(rng);
      return matchTxt && matchRng;
    });
  });

  // formulario
  form = this.fb.group({
    usuarioDni: ['', [Validators.required, Validators.minLength(6)]],
    zonaId:     [0,   [Validators.required, Validators.min(1)]],
    rango:      ['',  [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.error.set(null);

    // 👇 El tipo del observable queda coherente con tu service/modelo
    this.srv.getAllAutoridades().subscribe({
      next: (r: ApiResponse<AutoridadDTO[]>) => {
        this.autoridades.set(r?.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las autoridades.');
        this.loading.set(false);
      }
    });
  }

  nuevo() {
    this.editId.set(null);
    this.form.reset({ usuarioDni: '', zonaId: 0, rango: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editar(a: AutoridadDTO) {
    // id puede ser opcional en tu modelo → casteo defensivo
    this.editId.set((a as any).id ?? null);
    this.form.patchValue({
      usuarioDni: a.usuario?.dni ?? '',
      zonaId: a.zona?.id ?? 0,
      rango: a.rango ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;

    // Si no tenés UpdateAutoridadDTO en el modelo, podés usar CreateAutoridadDTO también para update.
    const dto: CreateAutoridadDTO = {
      usuarioDni: String(v.usuarioDni),
      zonaId: Number(v.zonaId),
      rango: String(v.rango),
    };

    this.loading.set(true);
    this.error.set(null);

    const id = this.editId();
    const obs = id == null
      ? this.srv.createAutoridad(dto)
      : this.srv.updateAutoridad(String(id), dto as unknown as UpdateAutoridadDTO);

    obs.subscribe({
      next: () => { this.nuevo(); this.cargar(); },
      error: () => { this.error.set('No se pudo guardar.'); this.loading.set(false); }
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar autoridad?')) return;
    this.loading.set(true);
    this.error.set(null);

    this.srv.deleteAutoridad(String(id)).subscribe({
      next: () => this.cargar(),
      error: () => { this.error.set('No se pudo eliminar.'); this.loading.set(false); }
    });
  }
}
