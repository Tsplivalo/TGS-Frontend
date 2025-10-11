export interface ShelbyCouncilDTO {
  id: number;
  partner: { dni: string; name: string } | null;
  decision: { id: number; description: string } | null;
  joinDate?: string;   // ISO
  role?: string | null;
  notes?: string | null;
}

export interface CreateShelbyCouncilDTO {
  partnerDni: string;
  decisionId: number;
  joinDate?: string;   // yyyy-MM-dd
  role?: string;
  notes?: string;
}

export interface PatchShelbyCouncilDTO {
  partnerDni?: string;
  decisionId?: number;
  joinDate?: string;
  role?: string;
  notes?: string;
}

export interface ApiResponse<T> { data: T; message?: string; }
