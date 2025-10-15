// ============================================
// MODELOS DE VENTA - CORREGIDOS
// Sincronizado con backend
// ============================================

export interface SaleClientDTO {
  dni: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SaleProductDTO {
  id: number;
  description?: string;
  price?: number;
  stock?: number;
}

export interface SaleDetailDTO {
  productId: number;
  quantity: number;
  // expanded info (viene del backend en GET)
  product?: SaleProductDTO;
  subtotal?: number;
}

export interface SaleDTO {
  id: number;
  date?: string;
  saleDate?: string; // backend usa "saleDate"
  client?: SaleClientDTO | null;
  distributor?: {
    dni: string;
    name?: string;
  };
  authority?: {
    dni: string;
    name?: string;
  };

  // multi items (lo que usa el backend)
  details?: SaleDetailDTO[];

  // Totales posibles
  amount?: number;
  saleAmount?: number;
  total?: number;
}

// DTO para CREAR venta (lo que espera el backend)
export interface CreateSaleDTO {
  clientDni: string;
  distributorDni: string; // ← REQUERIDO por el backend
  details: SaleDetailDTO[];
  person?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
}

// DTO para ACTUALIZAR venta
export interface UpdateSaleDTO {
  distributorDni?: string;
  authorityDni?: string | null;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
}