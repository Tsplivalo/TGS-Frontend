import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem { label: string; path: string; }

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent {
  // Items del menú NEGOCIO
  negocioItems: MenuItem[] = [
    { label: 'Productos',   path: '/producto'   },
    { label: 'Clientes',    path: '/cliente'    },
    { label: 'Ventas',      path: '/venta'      },
    { label: 'Zonas',       path: '/zona'       },
    { label: 'Autoridades', path: '/autoridad'  },
    { label: 'Sobornos',    path: '/sobornos'   },
    { label: 'Decisiones',  path: '/decision'   },
    { label: 'Temáticas',   path: '/tematica'   },
  ];
}
