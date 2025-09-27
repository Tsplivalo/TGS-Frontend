export interface VentaClienteDTO {
  dni: string;
  nombre?: string;
}

export interface VentaProductoDTO {
  id: number;
  descripcion?: string;
  precio?: number;
  stock?: number;
}

export interface VentaDetalleDTO {
  productoId: number;
  cantidad: number;
  // expandido
  producto?: VentaProductoDTO;
  // ⬇️ el back calcula esto
  subtotal?: number;
}

export interface VentaDTO {
  id: number;
  fecha?: string;
  cliente?: VentaClienteDTO | null;

  // legacy 1 línea
  producto?: VentaProductoDTO | null;
  cantidad?: number | null;

  // multi ítems
  detalles?: VentaDetalleDTO[];

  // ⬇️ totales posibles
  monto?: number;        // si el toDTO del back lo llama "monto"
  montoVenta?: number;   // si el toDTO lo deja como "montoVenta"

  // compat vieja
  total?: number;
}

export interface CreateVentaDTO {
  clienteDni: string;
  detalles: VentaDetalleDTO[]; // requerido
}

export interface UpdateVentaDTO {
  clienteDni?: string;
  detalles?: VentaDetalleDTO[];
  // compat opcional
  productoId?: number;
  cantidad?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
