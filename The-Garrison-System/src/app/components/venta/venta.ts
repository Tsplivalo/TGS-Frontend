// src/app/components/venta/venta.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }            from '@angular/common';
import { FormsModule }             from '@angular/forms';
import { VentaService }            from '../../services/venta/venta';
import { VentaDTO, CreateVentaDTO } from '../../models/venta/venta.model';
import { ClienteDTO }              from '../../models/cliente/cliente.model';
import { ProductoDTO }             from '../../models/producto/producto.model';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './venta.html',
  styleUrls: ['./venta.scss'],
})
export class VentaComponent implements OnInit {
  private ventaService = inject(VentaService);

  ventas: VentaDTO[] = [];

  // Para el formulario:
  nueva: CreateVentaDTO = {
    fecha_hora: new Date().toISOString(),
    total: 0,
    cliente: {} as ClienteDTO,
    productos: []
  };

  // Aquí definimos la propiedad que faltaba:
  productosInput: string = '';

  ngOnInit(): void {
    this.obtenerVentas();
  }

  obtenerVentas(): void {
    this.ventaService.getAllVentas().subscribe({
      next: resp => this.ventas = resp.data,
      error: err => console.error('Error cargando ventas', err)
    });
  }

  crearVenta(): void {
    // Convertimos la cadena de IDs en array de ProductoDTO
    const ids = this.productosInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(id => ({ id: Number(id) } as ProductoDTO));

    this.nueva.productos = ids;
    
    // Validamos
    if (!this.nueva.cliente || this.nueva.productos.length === 0) {
      console.warn('Debes seleccionar un cliente y al menos un producto');
      return;
    }

    this.ventaService.createVenta(this.nueva).subscribe({
      next: () => {
        // Reset formulario
        this.productosInput = '';
        this.nueva = {
          fecha_hora: new Date().toISOString(),
          total: 0,
          cliente: {} as ClienteDTO,
          productos: []
        };
        this.obtenerVentas();
      },
      error: err => console.error('Error creando venta', err)
    });
  }

  editarVenta(v: VentaDTO): void {
    const cambios: Partial<VentaDTO> = { total: v.total };
    this.ventaService.patchVenta(v.id, cambios).subscribe({
      next: () => this.obtenerVentas(),
      error: err => console.error('Error actualizando venta', err)
    });
  }

  eliminarVenta(id: number): void {
    this.ventaService.deleteVenta(id).subscribe({
      next: () => this.obtenerVentas(),
      error: err => console.error('Error eliminando venta', err)
    });
  }

  trackById(_: number, v: VentaDTO): number {
    return v.id;
  }
}
