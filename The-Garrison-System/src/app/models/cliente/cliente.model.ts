export interface Cliente {
  dni: string;             // Documento único
  nombre: string;          // Nombre completo
  email?: string;          // Correo electrónico
  direccion?: string;      // Dirección del cliente
  telefono?: string;       // Teléfono
  regCompras?: any[];      // Relación con ventas 
}
