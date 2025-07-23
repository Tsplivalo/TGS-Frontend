export interface Cliente {
  id: string;         // UUID generado en backend
  nombre: string;
  dni: string;
  email?: string;
  direccion?: string;
  telefono?: string;
}
