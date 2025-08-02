import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import {
  AutoridadService
} from '../../services/autoridad/autoridad';
import {
  AutoridadDTO,
  CreateAutoridadDTO
} from '../../models/autoridad/autoridad.model';

@Component({
  selector: 'app-autoridad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autoridad.html',
  styleUrls: ['./autoridad.scss'],
})
export class AutoridadComponent implements OnInit {
  private autoridadService = inject(AutoridadService);

  autoridades: AutoridadDTO[] = [];

  nueva: CreateAutoridadDTO = {
    dni: '',
    nombre: '',
    rango: 0,
    zonaId: 0
  };

  constructor() {}

  ngOnInit(): void {
    this.obtenerAutoridades();
  }

  obtenerAutoridades(): void {
    this.autoridadService.getAllAutoridades().subscribe({
      next: resp => this.autoridades = resp.data,
      error: err => console.error('Error cargando autoridades', err)
    });
  }

  crearAutoridad(): void {
    const { dni, nombre, rango, zonaId } = this.nueva;
    if (!dni || !nombre || rango < 0 || zonaId <= 0) {
      console.warn('Todos los campos son obligatorios y zonaId > 0');
      return;
    }

    this.autoridadService.createAutoridad(this.nueva).subscribe({
      next: () => {
        // limpiar formulario
        this.nueva = { dni: '', nombre: '', rango: 0, zonaId: 0 };
        this.obtenerAutoridades();
      },
      error: err => console.error('Error creando autoridad', err)
    });
  }

  editarAutoridad(a: AutoridadDTO): void {
    // Ejemplo: solo parcheamos el rango
    const cambios = { rango: a.rango };
    this.autoridadService.patchAutoridad(a.dni, cambios).subscribe({
      next: () => this.obtenerAutoridades(),
      error: err => console.error('Error actualizando autoridad', err)
    });
  }

  eliminarAutoridad(dni: string): void {
    this.autoridadService.deleteAutoridad(dni).subscribe({
      next: () => this.obtenerAutoridades(),
      error: err => console.error('Error eliminando autoridad', err)
    });
  }

  trackByDni(_: number, a: AutoridadDTO): string {
    return a.dni;
  }
}
