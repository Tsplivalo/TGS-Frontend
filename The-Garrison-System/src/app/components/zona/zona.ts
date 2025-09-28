import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ZonaService } from '../../services/zona/zona';
import {
  ApiResponse,
  ZonaDTO,
  CreateZonaDTO
} from '../../models/zona/zona.model';

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

  // estado UI
  loading = signal(false);
  error   = signal<string | null>(null); // se usa como recuadro de error
  editId  = signal<number | null>(null);

  // datos
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

  // sede central actual (para mostrar arriba)
  sedeCentral = computed(() => this.zonas().find(z => z.esSedeCentral) ?? null);

  // form
  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    esSedeCentral: [false],
  });

  ngOnInit() {
    this.cargar();
  }

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
    this.form.reset({ nombre: '', descripcion: '', esSedeCentral: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.error.set(null); // limpio errores visuales
  }

  editar(z: ZonaDTO) {
    this.editId.set(z.id);
    this.form.patchValue({
      nombre: z.nombre,
      descripcion: z.descripcion ?? '',
      esSedeCentral: !!z.esSedeCentral
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.error.set(null);
  }

  // dentro del componente Zonas
formAbierto = false;

toggleForm() {
  // si estabas editando, opcionalmente podrías resetear:
  //if (!this.formAbierto) this.nuevo();
  this.formAbierto = !this.formAbierto;
}

  guardar() {
    this.error.set(null);

    const raw = this.form.getRawValue();
    const id = this.editId();

    // normalizo
    const nombre = (raw.nombre ?? '').trim();
    const payloadCreate = {
      nombre,
      descripcion: raw.descripcion?.toString().trim() ? raw.descripcion.toString().trim() : undefined,
      esSedeCentral: !!raw.esSedeCentral,
    };
    const payloadUpdate = { ...payloadCreate };

    // 👉 CREATE (igual que antes)
    if (id == null) {
      this.srv.createZona(payloadCreate).subscribe({
        next: () => { this.nuevo(); this.cargar(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        error: (e) => this.handleSaveError(e),
      });
      return;
    }

    this.srv.isNombreDisponible(nombre, id).subscribe(isFree => {
      if (!isFree) {
        // mismo comportamiento que en create
        this.error.set('Ya existe una zona con ese nombre (sin importar mayúsculas/minúsculas).');
        const ctrl = this.form.controls['nombre'];
        ctrl.setErrors({ ...(ctrl.errors ?? {}), nombreDuplicado: true });
        ctrl.markAsTouched();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // si está libre, actualizo
      this.srv.updateZona(id, payloadUpdate).subscribe({
        next: () => { this.nuevo(); this.cargar(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
        error: (e) => this.handleSaveError(e),
      });
    });
  }

  // helper de manejo de error (reusa tu lógica actual)
  private handleSaveError(e: any) {
    const backendMsg = e?.error?.mensaje?.toString();

    if (e?.status === 409) {
      const msg = backendMsg || 'Ya existe una zona con ese nombre (sin importar mayúsculas/minúsculas).';
      this.error.set(msg);
      const ctrl = this.form.controls['nombre'];
      ctrl.setErrors({ ...(ctrl.errors ?? {}), nombreDuplicado: true });
      ctrl.markAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (e?.status === 400 && backendMsg) {
      this.error.set(backendMsg);
      if (/nombre/i.test(backendMsg)) {
        const ctrl = this.form.controls['nombre'];
        ctrl.setErrors({ ...(ctrl.errors ?? {}), required: true });
        ctrl.markAsTouched();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.error.set(backendMsg || 'No se pudo guardar la zona.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  eliminar(z: ZonaDTO) {
    // Si es sede central, no eliminar y mostrar recuadro de error
    if (z.esSedeCentral) {
      this.error.set(
        `No se puede eliminar la zona "${z.nombre}" porque es la sede central actual. ` +
        `Para eliminarla, primero asigná otra zona como sede central.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!confirm(`¿Eliminar zona "${z.nombre}"?`)) return;

    this.loading.set(true);
    this.srv.deleteZona(z.id).subscribe({
      next: () => { this.error.set(null); this.cargar(); },
      error: (e) => {
        console.error(e);
        this.error.set('No se pudo eliminar.');
        this.loading.set(false);
      }
    });
  }
}
