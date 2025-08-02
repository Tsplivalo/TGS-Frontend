// src/app/models/cliente/cliente.model.ts
import { VentaDTO } from '../../models/venta/venta.model';

export interface ClienteDTO {
  dni:       string;
  nombre:    string;
  email?:    string;
  direccion?: string;
  telefono?:  string;
  regCompras: VentaDTO[];    
}

export interface ApiResponse<T> {
  data: T;
}
