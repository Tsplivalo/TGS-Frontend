// src/app/models/venta/venta.model.ts
import { ClienteDTO } from '../cliente/cliente.model';
import { ProductoDTO } from '../producto/producto.model';

export interface VentaDTO {
  id: number;                 // o "nro" si lo llamas así
  fecha_hora: string;         // ISO timestamp
  total: number;
  cliente: ClienteDTO;
  productos: ProductoDTO[];   // array de productos incluidos en la venta
}

export interface ApiResponse<T> {
  data: T;
}

export type CreateVentaDTO = Omit<VentaDTO, 'id'>;