export interface ClandestineAgreementDTO {
  id: number;
  description: string;
  agreementDate: string; // ISO date
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  shelbyCouncil?: { id: number } | null;
  authority?: { dni: string; name: string; rank?: string } | null;
}

export interface CreateClandestineAgreementDTO {
  description: string;
  agreementDate: string; // yyyy-MM-dd
  status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  shelbyCouncilId: number;
  authorityDni: string;
}

export interface PatchClandestineAgreementDTO {
  description?: string;
  agreementDate?: string; // yyyy-MM-dd
  status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  shelbyCouncilId?: number;
  authorityDni?: string;
}

export interface ApiResponse<T> { data: T; message?: string; }
