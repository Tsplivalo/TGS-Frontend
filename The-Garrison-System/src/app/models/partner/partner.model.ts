// src/app/models/partner/partner.model.ts
export type PartnerDecisionRefDTO = {
  id: number;
  description?: string | null;
};

export interface PartnerDTO {
  dni: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  decisions?: PartnerDecisionRefDTO[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreatePartnerDTO = {
  dni: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  // el back admite password opcional (si aplica)
  password?: string | null;
};

export type PatchPartnerDTO = Partial<Omit<CreatePartnerDTO, 'dni'>>;

export type PartnerListResponse = { data: PartnerDTO[] };
export type PartnerItemResponse = { data: PartnerDTO };
