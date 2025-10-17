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
  // ✅ Canales principales - ACTUALIZADOS
  channels: Channel[] = [
    {
      label: 'Email',
      value: 'thegarrisonsystem@gmail.com',
      href: 'mailto:thegarrisonsystem@gmail.com',
      hint: 'Respondemos en ~24 hs hábiles',
    },
    {
      label: 'Teléfono',
      value: '+54 341 555-1234',
      href: 'tel:+543415551234',
      hint: 'Lun a Vie · 09–18 h',
    },
    {
      label: 'WhatsApp',
      value: '+54 9 341 555-1234',
      href: 'https://wa.me/5493415551234',
      hint: 'Respuesta rápida',
    },
  ];

  // Horarios
  hours: KV[] = [
    { label: 'Soporte',   value: 'Lun a Vie · 09:00–18:00' },
    { label: 'Comercial', value: 'Lun a Vie · 10:00–17:00' },
  ];

  // ✅ Dirección - ACTUALIZADA (UTN Rosario)
  address = 'Zeballos 1341, S2000 Rosario, Santa Fe, Argentina';
  mapHref = 'https://maps.app.goo.gl/us7wsEg9MFs9cfky7';

  // ✅ Enlaces útiles - ACTUALIZADOS
  links: Channel[] = [
    { 
      label: 'GitHub del Proyecto', 
      value: 'github.com/lautaro-peralta', 
      href: 'https://github.com/lautaro-peralta/TP-Desarrollo-de-Software', 
      hint: 'Código fuente y documentación' 
    },
    { 
      label: 'UTN Rosario',       
      value: 'frro.utn.edu.ar',   
      href: 'https://www.frro.utn.edu.ar/', 
      hint: 'Facultad Regional Rosario' 
    },
    { 
      label: 'Soporte Técnico',            
      value: 'thegarrisonsystem@gmail.com',           
      href: 'mailto:thegarrisonsystem@gmail.com', 
      hint: 'Contacto directo por email' 
    },
  ];
}