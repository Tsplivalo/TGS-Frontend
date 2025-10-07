import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type ValueItem = { title: string; desc: string };
type TeamItem  = { name: string; role: string };

@Component({
  standalone: true,
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})
export class AboutComponent {
  // Usá tus datos reales; dejo @Input por si ya los inyectás desde afuera.
  @Input() mission = 'Impulsamos a equipos a trabajar con claridad, foco y simplicidad.';
  @Input() values: ValueItem[] = [
    { title: 'Transparencia', desc: 'Comunicación clara y decisiones a la vista.' },
    { title: 'Calidad',       desc: 'Cuidamos el detalle en cada entrega.' },
    { title: 'Velocidad',     desc: 'Iteramos rápido sin perder solidez.' },
    { title: 'Cercanía',      desc: 'Escuchamos y acompañamos al cliente.' },
    { title: 'Aprendizaje',   desc: 'Mejora continua como cultura.' },
    { title: 'Propósito',     desc: 'Construimos productos que importan.' },
  ];
  @Input() team: TeamItem[] = [
    { name: 'Lautaro Peralta',  role: 'Backend/Frontend' },
    { name: 'Tomas Splivalo',  role: 'Frontend' },
    { name: 'Luca Delprato',  role: 'Frontend'  },
 
  ];

  // Iniciales para avatar fallback
  initials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0]?.toUpperCase())
      .join('');
  }
}
