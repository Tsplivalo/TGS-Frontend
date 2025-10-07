import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Channel = { label: string; value: string; href: string; hint?: string };
type KV = { label: string; value: string };

@Component({
  standalone: true,
  selector: 'app-contact',
  imports: [CommonModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss'],
})
export class ContactComponent {
  // Canales principales
  channels: Channel[] = [
    {
      label: 'Email',
      value: 'soporte@garrsys.com',
      href: 'mailto:soporte@garrsys.com',
      hint: 'Respondemos en ~24 hs hábiles',
    },
    {
      label: 'Teléfono',
      value: '+54 351 555-1234',
      href: 'tel:+543515551234',
      hint: 'Lun a Vie · 09–18 h',
    },
    {
      label: 'WhatsApp',
      value: '+54 9 351 555-1234',
      href: 'https://wa.me/5493515551234',
      hint: 'Respuesta rápida',
    },
  ];

  // Horarios
  hours: KV[] = [
    { label: 'Soporte',   value: 'Lun a Vie · 09:00–18:00' },
    { label: 'Comercial', value: 'Lun a Vie · 10:00–17:00' },
  ];

  // Dirección
  address = 'Av. Siempre Viva 123, Córdoba, Argentina';
  mapHref = 'https://www.google.com/maps?q=Av.+Siempre+Viva+123,+Córdoba,+Argentina';

  // Enlaces útiles / redes (opcionales)
  links: Channel[] = [
    { label: 'Estado del servicio', value: 'status.garrsys.com', href: '#', hint: 'Disponibilidad en tiempo real' },
    { label: 'Documentación',       value: 'docs.garrsys.com',   href: '#', hint: 'Guías y referencias' },
    { label: 'LinkedIn',            value: '@garrsys',           href: '#', hint: 'Novedades y lanzamientos' },
  ];
}
