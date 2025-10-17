import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Faq = { q: string; a: string; open?: boolean };

@Component({
  standalone: true,
  selector: 'app-faqs',
  imports: [CommonModule],
  templateUrl: './faqs.html',
  styleUrls: ['./faqs.scss'],
})
export class FaqsComponent {
  // Todas comienzan cerradas (open: false)
  faqs: Faq[] = [
    { q: '¿Cómo comienzo?', a: 'Creá tu cuenta o iniciá sesión. Luego cargá productos y clientes desde Gestión.', open: false },
    { q: '¿Puedo exportar datos?', a: 'Sí, las vistas principales permiten exportar listados para informes y auditorías.', open: false },
    { q: '¿Cómo manejo permisos?', a: 'Definí roles por áreas (ventas, administración, etc.) y asigná accesos selectivos.', open: false },
    { q: '¿Se integra con otros sistemas?', a: 'Ofrecemos API e importadores para conectar tu stack actual.', open: false },
  ];

  toggle(i: number) {
    this.faqs[i].open = !this.faqs[i].open;
  }

  keyToggle(i: number, ev: KeyboardEvent) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.toggle(i);
    }
  }
}
