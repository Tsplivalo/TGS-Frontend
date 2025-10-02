import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Faq = { q: string; a: string; open?: boolean };

@Component({
  selector: 'tgs-faqs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.scss'],
})
export class FaqsComponent {
  faqs: Faq[] = [
    { q: '¿Qué es The Garrison System?', a: 'Es una plataforma para gestionar entidades, ventas y reportes con buenas prácticas de seguridad y UX.', open: true },
    { q: '¿Cómo protegen mis datos?', a: 'Usamos autenticación (JWT/sesiones), validación de inputs y controles de acceso por rol.' },
    { q: '¿Ofrecen soporte?', a: 'Sí, podés usar el formulario de contacto y te respondemos a la brevedad.' },
    { q: '¿Tiene modo oscuro?', a: 'Sí, el tema respeta la preferencia del sistema y puede cambiarse en la app.' },
  ];

  toggle(i: number) {
    this.faqs[i].open = !this.faqs[i].open;
  }
}
