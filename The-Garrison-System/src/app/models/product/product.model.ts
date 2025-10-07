export interface ProductDTO {
  id: number;
  description: string;
  price: number;
  stock: number;
  isIllegal: boolean; // NEW
}

export interface ApiResponse<T> { data: T; }


export type CreateProductDTO = Omit<ProductDTO, 'id'>;


export type UpdateProductDTO = Partial<CreateProductDTO>;