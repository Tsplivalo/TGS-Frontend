// Adjusted to the DTO exposed by the backend in toDTO()
export interface AuthorityDTO {
  dni: string;
  name: string;
  rank: number;   // 0..3
  zone?: {
    id?: number | string;
    name?: string;
  } | null;
  bribes?: any;  // the back can return a list or a string
}

// Body to create (according to the zod schema of the back)
export interface CreateAuthorityDTO {
  dni: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  // the back expects a string '0'|'1'|'2'|'3' and transforms it to a number
  rank: '0' | '1' | '2' | '3';
  // the back expects a string and transforms it to a number
  zoneId: string;
}

// Body for full update (PUT)
export interface UpdateAuthorityDTO {
  name: string;
  rank: '0' | '1' | '2' | '3';
  zoneId: string;
}

// Body for partial update (PATCH)
export interface PatchAuthorityDTO {
  name?: string;
  rank?: '0' | '1' | '2' | '3';
  zoneId?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
