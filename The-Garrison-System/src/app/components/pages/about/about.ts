import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tgs-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  mission = 'Construimos herramientas para digitalizar procesos complejos con foco en seguridad, UX y rendimiento.';
  values = [
    { title: 'Transparencia', desc: 'Comunicación clara y decisiones auditables.' },
    { title: 'Calidad', desc: 'Pruebas automatizadas y buenas prácticas.' },
    { title: 'Seguridad', desc: 'Protección de datos, autenticación robusta.' },
    { title: 'Accesibilidad', desc: 'Interfaces usables por todas las personas.' },
  ];
  team = [
    { name: 'Luca Delprato', role: 'Full-stack Dev', avatar: 'https://i.pravatar.cc/120?img=5' },
    { name: 'Colaborador/a', role: 'UX/UI', avatar: 'https://i.pravatar.cc/120?img=15' },
  ];
  timeline = [
    { year: 2024, text: 'Primer commit del proyecto TGS.' },
    { year: 2025, text: 'Módulos clave y primeras métricas en producción.' },
  ];
}
