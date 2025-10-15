// src/app/models/client/client.model.ts
import { SaleDTO } from '../sale/sale.model';

/**
 * DTO del cliente que coincide con la respuesta del backend
 */
export interface ClientDTO {
  dni: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  purchases?: SaleDTO[] | string; // Puede ser array, string o no estar presente
}

/**
 * DTO para crear un cliente (con campos opcionales para usuario)
 */
export interface CreateClientDTO {
  dni: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  username?: string;
  password?: string;
}

/**
 * DTO para actualizar un cliente (todos los campos opcionales excepto los que se quieran cambiar)
 */
export interface UpdateClientDTO {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
}

/**
 * Estructura de respuesta estándar del API
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * Respuesta al crear un cliente (incluye datos anidados)
 */
export interface CreateClientResponse {
  client: ClientDTO;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}