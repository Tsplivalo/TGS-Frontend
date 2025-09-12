import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ZonaService } from '../../services/zona/zona';

// DTOs locales (ajusta si ya tenés modelos)
export interface ZonaDTO { id: number; nombre: string; descripcion?: string; }
export interface ApiResponse<T> { data: T; message?: string; }
export type CreateZonaDTO = Omit<ZonaDTO, 'id'>;
export type UpdateZonaDTO = Partial<CreateZonaDTO>;

@Component({
  selector: 'app-zona',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './zona.html',
  styleUrls: ['./zona.scss']
})
export class ZonaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(ZonaService);

  loading = signal(false);
  error   = signal<string | null>(null);
  editId  = signal<number | null>(null);

  zonas = signal<ZonaDTO[]>([]);

  // filtros
  fTexto = signal('');

  listaFiltrada = computed(() => {
    const txt = this.fTexto().toLowerCase().trim();
    return this.zonas().filter(z => {
      const matchTxt = !txt
        || String(z.id).includes(txt)
        || z.nombre.toLowerCase().includes(txt)
        || (z.descripcion ?? '').toLowerCase().includes(txt);
      return matchTxt;
    });
  });

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAllZonas().subscribe({
      next: (r: ApiResponse<ZonaDTO[]>) => { this.zonas.set(r.data ?? []); this.loading.set(false); },
      error: () => { this.error.set('No se pudieron cargar las zonas.'); this.loading.set(false); }
    });
  }

  nuevo() {
    this.editId.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editar(z: ZonaDTO) {
    this.editId.set(z.id);
    this.form.patchValue({ nombre: z.nombre, descripcion: z.descripcion ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;

    // DTO completo para ambos casos (create/update)
    const createDto: CreateZonaDTO = {
      nombre: String(v.nombre),                         // <-- siempre string
      descripcion: (v.descripcion ?? '').toString() || undefined
    };

    this.loading.set(true); this.error.set(null);

    const id = this.editId();
    const obs = id == null
      ? this.srv.createZona(createDto)
      : this.srv.updateZona(id, createDto);            // <-- ya no pasamos Partial

    obs.subscribe({
      next: () => { this.nuevo(); this.cargar(); },
      error: () => { this.error.set('No se pudo guardar.'); this.loading.set(false); }
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar zona?')) return;
    this.loading.set(true); this.error.set(null);
    this.srv.deleteZona(id).subscribe({
      next: () => this.cargar(),
      error: () => { this.error.set('No se pudo eliminar.'); this.loading.set(false); }
    });
  }
}
