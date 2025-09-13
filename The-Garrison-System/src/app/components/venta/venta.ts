import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VentaService } from '../../services/venta/venta';

// 👇 Usa TUS modelos para evitar conflictos de tipos
import {
  ApiResponse,
  VentaDTO,
  CreateVentaDTO,
  // No importo Update para evitar desalineaciones: envío CreateVentaDTO también en update
} from '../../models/venta/venta.model';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './venta.html',
  styleUrls: ['./venta.scss']
})
export class VentaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private srv = inject(VentaService);

  // estado
  loading = signal(false);
  error   = signal<string | null>(null);
  editId  = signal<number | null>(null);

  // datos
  ventas = signal<VentaDTO[]>([]);

  // filtros
  fTexto = signal('');
  fDesde = signal<string>('');
  fHasta = signal<string>('');

  // lista filtrada (usa los campos del modelo: fechaVenta, montoVenta, cliente?.dni, autoridad?.id, descripcion)
  listaFiltrada = computed(() => {
    const txt = this.fTexto().toLowerCase().trim();
    const d1  = this.fDesde();
    const d2  = this.fHasta();

    return (this.ventas() ?? []).filter(v => {
      const desc = (v.descripcion ?? '').toLowerCase();
      const cli  = (v.cliente?.dni ?? '').toLowerCase();
      const aut  = String(v.autoridad?.id ?? '');

      const matchTxt = !txt || desc.includes(txt) || cli.includes(txt) || aut.includes(txt);

      const fecha = v.fechaVenta ? new Date(v.fechaVenta) : null;
      const okDesde = !d1 || (fecha && fecha >= new Date(d1));
      const okHasta = !d2 || (fecha && fecha <= new Date(d2 + 'T23:59:59'));

      return matchTxt && okDesde && okHasta;
    });
  });

  // formulario
  form = this.fb.group({
    clienteDni: ['', [Validators.required, Validators.minLength(6)]],
    autoridadId: [0, [Validators.required, Validators.min(1)]],
    fechaVenta: [this.hoyISO(), [Validators.required]],   // yyyy-mm-dd
    montoVenta: [0, [Validators.required, Validators.min(0)]],
    descripcion: [''],
  });

  ngOnInit() { this.cargar(); }

  private hoyISO(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  cargar() {
    this.loading.set(true);
    this.error.set(null);

    this.srv.getAllVentas().subscribe({
      next: (r: ApiResponse<VentaDTO[]>) => {
        this.ventas.set(r?.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las ventas.');
        this.loading.set(false);
      }
    });
  }

  nuevo() {
    this.editId.set(null);
    this.form.reset({
      clienteDni: '',
      autoridadId: 0,
      fechaVenta: this.hoyISO(),
      montoVenta: 0,
      descripcion: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editar(v: VentaDTO) {
    this.editId.set((v as any).id ?? null); // defensivo si id es opcional en el modelo
    this.form.patchValue({
      clienteDni: v.cliente?.dni ?? '',
      autoridadId: v.autoridad?.id ?? 0,
      fechaVenta: (v.fechaVenta ?? '').slice(0, 10),
      montoVenta: v.montoVenta ?? 0,
      descripcion: v.descripcion ?? ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const x = this.form.value;
    const dto: CreateVentaDTO = {
      clienteDni: String(x.clienteDni),
      autoridadId: Number(x.autoridadId),
      fechaVenta: new Date(String(x.fechaVenta)).toISOString(), // guardo ISO completo
      montoVenta: Number(x.montoVenta),
      descripcion: (x.descripcion ?? '').toString() || undefined,
    };

    this.loading.set(true);
    this.error.set(null);

    const id = this.editId();
    const obs = id == null
      ? this.srv.createVenta(dto)
      : this.srv.updateVenta(id, dto); // enviamos CreateVentaDTO también en update (sirve si el service espera PUT o PATCH)

    obs.subscribe({
      next: () => { this.nuevo(); this.cargar(); },
      error: () => { this.error.set('No se pudo guardar.'); this.loading.set(false); }
    });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar venta?')) return;
    this.loading.set(true);
    this.error.set(null);
    this.srv.deleteVenta(id).subscribe({
      next: () => this.cargar(),
      error: () => { this.error.set('No se pudo eliminar.'); this.loading.set(false); }
    });
  }
}
