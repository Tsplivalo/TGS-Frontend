import { Component, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';


@Component({
selector: 'tgs-faqs',
standalone: true,
imports: [NgFor, NgIf, PageHeaderComponent],
templateUrl: './faqs.component.html',
styleUrls: ['./faqs.component.css']
})
export class FaqsComponent {
openIndex = signal<number | null>(0);
faqs = [
{ q: '¿Qué es The Garrison System?', a: 'Es una plataforma para gestionar entidades, ventas y reportes con buenas prácticas de seguridad y UX.' },
{ q: '¿Cómo protegen mis datos?', a: 'Usamos autenticación (JWT/sesiones), validación de inputs y controles de acceso por rol.' },
{ q: '¿Ofrecen soporte?', a: 'Sí, podés usar el formulario de contacto y te respondemos a la brevedad.' },
{ q: '¿Tiene modo oscuro?', a: 'Sí, el tema respeta la preferencia del sistema y puede cambiarse en la app.' },
];
toggle(i: number){ this.openIndex.set(this.openIndex() === i ? null : i); }
}