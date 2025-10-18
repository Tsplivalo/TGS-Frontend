import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Channel = { label: string; value: string; href: string; hint?: string; icon?: string };
type KV = { label: string; value: string };

@Component({
  standalone: true,
  selector: 'app-contact',
  imports: [CommonModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss'],
})
export class ContactComponent {
  // ✅ Canales principales - ACTUALIZADOS CON ICONOS
  channels: Channel[] = [
    {
      label: 'Email',
      value: 'thegarrisonsystem@gmail.com',
      href: 'mailto:thegarrisonsystem@gmail.com',
      hint: 'Respondemos en ~24 hs hábiles',
      icon: 'https://cdn.simpleicons.org/gmail/EA4335',
    },
    {
      label: 'Teléfono',
      value: '+54 341 555-1234',
      href: 'tel:+543415551234',
      hint: 'Lun a Vie · 09–18 h',
      icon: 'https://api.iconify.design/heroicons:phone-solid.svg?color=%234285F4',
    },
    {
      label: 'WhatsApp',
      value: '+54 9 341 555-1234',
      href: 'https://wa.me/5493415551234',
      hint: 'Respuesta rápida',
      icon: 'https://cdn.simpleicons.org/whatsapp/25D366',
    },
  ];

  // Horarios
  hours: KV[] = [
    { label: 'Soporte',   value: 'Lun a Vie · 09:00–18:00' },
    { label: 'Comercial', value: 'Lun a Vie · 10:00–17:00' },
  ];

  // ✅ Dirección - ACTUALIZADA CON ICONO
  address = 'Zeballos 1341, S2000 Rosario, Santa Fe, Argentina';
  mapHref = 'https://maps.app.goo.gl/us7wsEg9MFs9cfky7';
  mapIcon = 'https://cdn.simpleicons.org/googlemaps/4285F4';

  // ✅ Enlaces útiles - ACTUALIZADOS CON ICONOS
  links: Channel[] = [
    { 
      label: 'GitHub del Proyecto', 
      value: 'github.com/lautaro-peralta', 
      href: 'https://github.com/lautaro-peralta/TP-Desarrollo-de-Software', 
      hint: 'Código fuente y documentación',
      icon: 'https://cdn.simpleicons.org/github/FFFFFF',
    },
    { 
      label: 'UTN Rosario',       
      value: 'frro.utn.edu.ar',   
      href: 'https://www.frro.utn.edu.ar/', 
      hint: 'Facultad Regional Rosario',
      icon: 'https://cdn.simpleicons.org/educative/0052CC',
    },
    { 
      label: 'Soporte Técnico',            
      value: 'thegarrisonsystem@gmail.com',           
      href: 'mailto:thegarrisonsystem@gmail.com', 
      hint: 'Contacto directo por email',
      icon: 'https://cdn.simpleicons.org/gmail/EA4335',
    },
  ];
}