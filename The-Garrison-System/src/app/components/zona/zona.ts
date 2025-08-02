import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }                from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ZonaService }                 from '../../services/zona/zona';
import { ZonaDTO, CreateZonaDTO }      from '../../models/zona/zona.model';

@Component({
  selector: 'app-zona',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './zona.html',
  styleUrls: ['./zona.scss']
})
export class ZonaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private zonaService = inject(ZonaService);

  zonas: ZonaDTO[] = [];
  form!: FormGroup;
  editingId: number | null = null;

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required]
    });
    this.loadZonas();
  }

  loadZonas(): void {
    this.zonaService.getAllZonas().subscribe({
      next: resp => this.zonas = resp.data,
      error: err => console.error('Error cargando zonas', err)
    });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const value: CreateZonaDTO = this.form.value;
    if (this.editingId != null) {
      // edición
      this.zonaService.updateZona(this.editingId, value).subscribe({
        next: () => { this.resetForm(); this.loadZonas(); },
        error: err => console.error('Error actualizando zona', err)
      });
    } else {
      // creación
      this.zonaService.createZona(value).subscribe({
        next: () => { this.resetForm(); this.loadZonas(); },
        error: err => console.error('Error creando zona', err)
      });
    }
  }

  edit(z: ZonaDTO): void {
    this.editingId = z.id;
    this.form.setValue({ nombre: z.nombre });
  }

  delete(id: number): void {
    this.zonaService.deleteZona(id).subscribe({
      next: () => this.loadZonas(),
      error: err => console.error('Error eliminando zona', err)
    });
  }

  cancel(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.editingId = null;
    this.form.reset({ nombre: '' });
  }
}