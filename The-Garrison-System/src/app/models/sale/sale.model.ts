export interface SaleClientDTO {
  dni: string;
  name?: string;
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
  // expanded
  product?: SaleProductDTO;
  // ⬇️ the backend calculates this
  subtotal?: number;
}

export interface SaleDTO {
  id: number;
  date?: string;
  client?: SaleClientDTO | null;

  // legacy 1 line
  product?: SaleProductDTO | null;
  quantity?: number | null;

  // multi items
  details?: SaleDetailDTO[];

  // ⬇️ possible totals
  amount?: number;        // if the backend's toDTO calls it "amount"
  saleAmount?: number;   // if the toDTO leaves it as "saleAmount"

  // old compat
  total?: number;
}

export interface CreateSaleDTO {
  clientDni: string;
  details: SaleDetailDTO[]; // required
}

export interface UpdateSaleDTO {
  clientDni?: string;
  details?: SaleDetailDTO[];
  // optional compat
  productId?: number;
  quantity?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}