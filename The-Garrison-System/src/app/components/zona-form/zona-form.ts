import { Component } from '@angular/core';
import { ZonaService } from 'src/app/services/zona.service';
import { Zona } from 'src/app/models/zona.model';

@Component({
  selector: 'app-zona-form',
  templateUrl: './zona-form.component.html'
})
export class ZonaFormComponent {
  zona: Zona = { nombre: '' };

  constructor(private zonaService: ZonaService) {}

  crearZona() {
    this.zonaService.crearZona(this.zona).subscribe({
      next: res => console.log('Zona creada:', res),
      error: err => console.error('Error:', err),
    });
  }
}
