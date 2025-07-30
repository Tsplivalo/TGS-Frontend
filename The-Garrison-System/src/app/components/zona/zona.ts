import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZonaService } from '../../services/zona/zona';
import { Zona } from '../../models/zona/zona.model.js';


@Component({
  selector: 'app-zona',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zona.html',
  styleUrls: ['./zona.scss'],
})

export class ZonaComponent implements OnInit {
  zonas: Zona[] = [];

  constructor(private zonaService: ZonaService) {}

  ngOnInit(): void {
    this.obtenerZonas();
  }

  obtenerZonas(): void {
    this.zonaService.getAllZonas().subscribe((data) => {
      this.zonas = data;
    });
  }
}
