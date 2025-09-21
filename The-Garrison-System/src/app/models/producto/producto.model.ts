export interface ProductoDTO {
  id: number;
  descripcion: string;
  precio: number;
  stock: number;
  esIlegal: boolean; // NUEVO
}

export interface ApiResponse<T> { data: T; }


export type CreateProductoDTO = Omit<ProductoDTO, 'id'>;


export type UpdateProductoDTO = Partial<CreateProductoDTO>;
