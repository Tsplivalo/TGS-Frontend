export type PartnerStatus = 'active' | 'inactive';

export interface PartnerDTO {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  status: PartnerStatus;
  // in case you link relationships tomorrow
  linkedEntityIds?: number[];
}

// typical API responses (supports with/without meta)
export interface ApiResponse<T> {
  success?: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp?: string;
    statusCode?: number;
    total?: number;
    page?: number;
    limit?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface ListResponse<T> extends ApiResponse<T[]> {}
export interface ItemResponse<T> extends ApiResponse<T> {}