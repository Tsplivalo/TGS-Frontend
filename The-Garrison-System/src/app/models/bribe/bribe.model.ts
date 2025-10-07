export interface BribeDTO {
  id: number;
  amount: number;
  paid: boolean;
  creationDate?: string;

  // Relationships (your backend populates authority and sale)
  authority?: { id: string | number; dni?: string; name?: string } | null;
  authorityId?: string | number | null;
  authorityDni?: string | null; // we keep it for UI compatibility

  sale?: { id: number } | null;
  saleId?: number | null;
}

export interface CreateBribeDTO {
  // 👇 the backend expects these names
  amount: number;
  authorityId: string | number; // ID of Authority, not DNI
  saleId: number;
  paid?: boolean;
}

export interface UpdateBribeDTO {
  amount?: number;
  authorityId?: string | number;
  saleId?: number;
  paid?: boolean;
  // if your backend allows touching the date:
  creationDate?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}