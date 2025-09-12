import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SobornoService } from '../../services/soborno/soborno';
import { SobornoPendienteDTO, CreateSobornoDTO, UpdateSobornoDTO, SobornoEstado, ApiResponse } from '../../models/soborno/soborno.model';

@Component({
  selector: 'app-soborno',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './soborno.html',
  styleUrls: ['./soborno.scss']
})
export class SobornoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(SobornoService);

  // estado
  loading = signal(false);
  error = signal<string | null>(null);
  editId = signal<number | null>(null);

  // datos
  sobornos = signal<SobornoPendienteDTO[]>([]);
  estados: SobornoEstado[] = ['PENDIENTE', 'PAGADO'];

  // filtros
  fTexto = signal('');
  fEstado = signal<SobornoEstado | ''>('');
  fDesde = signal<string>(''); // yyyy-mm-dd
  fHasta = signal<string>('');

  // vista filtrada
  listaFiltrada = computed(() => {
    const txt = this.fTexto().toLowerCase().trim();
    const est = this.fEstado();
    const d1 = this.fDesde();
    const d2 = this.fHasta();

    return this.sobornos().filter(s => {
      const matchTxt =
        !txt ||
        String(s.id).includes(txt) ||
        String(s.autoridadId).includes(txt) ||
        (s.observaciones ?? '').toLowerCase().includes(txt);

      const matchEstado = !est || s.estado === est;

      const f = s.fecha ? new Date(s.fecha) : null;
      const desdeOk = !d1 || (f && f >= new Date(d1));
      const hastaOk = !d2 || (f && f <= new Date(d2 + 'T23:59:59'));

      return matchTxt && matchEstado && desdeOk && hastaOk;
    });
  });

  // formulario
  form = this.fb.group({
    autoridadId: [0, [Validators.required, Validators.min(1)]],
    monto: [0, [Validators.required, Validators.min(1)]],
    estado: ['PENDIENTE' as SobornoEstado, [Validators.required]],
    fecha: [new Date().toISOString().slice(0,10), [Validators.required]],
    observaciones: [''],
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.error.set(null);
    this.srv.getAll().subscribe({
      next: (r: ApiResponse<SobornoPendienteDTO[]>) => {
        this.sobornos.set(r.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los sobornos.');
        this.loading.set(false);
      }
    });
  }

  nuevo() {
    this.editId.set(null);
    this.form.reset({
      autoridadId: 0,
      monto: 0,
      estado: 'PENDIENTE',
      fecha: new Date().toISOString().slice(0,10),
      observaciones: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editar(s: SobornoPendienteDTO) {
    this.editId.set(s.id);
    this.form.patchValue({
      autoridadId: s.autoridadId,
      monto: s.monto,
      estado: s.estado,
      fecha: (s.fecha ?? '').slice(0,10),
      observaciones: s.observaciones ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.getRawValue();
    const dto: CreateSobornoDTO = {
      autoridadId: Number(v.autoridadId ?? 0),
      monto: Number(v.monto ?? 0),
      estado: (v.estado ?? 'PENDIENTE') as SobornoEstado,
      fecha: new Date(v.fecha ?? new Date().toISOString().slice(0,10)).toISOString(),
      observaciones: v.observaciones ?? ''
    };

    this.loading.set(true);
    this.error.set(null);

    const id = this.editId();
    const obs = id == null ? this.srv.create(dto) : this.srv.update(id, dto);

    obs.subscribe({
      next: () => { this.nuevo(); this.cargar(); },
      error: () => { this.error.set('No se pudo guardar.'); this.loading.set(false); }
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar soborno pendiente?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.delete(id).subscribe({
      next: () => this.cargar(),
      error: () => { this.error.set('No se pudo eliminar.'); this.loading.set(false); }
    });
  }
}
