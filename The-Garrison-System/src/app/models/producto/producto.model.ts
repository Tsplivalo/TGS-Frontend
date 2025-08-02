export interface ProductoDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
}

export interface ApiResponse<T> {
  data: T;
}

export type CreateProductoDTO = Omit<ProductoDTO, 'id'>;
export type UpdateProductoDTO = Partial<CreateProductoDTO>;