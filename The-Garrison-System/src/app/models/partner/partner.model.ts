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

/**
 * El backend acepta crear socio con:
 * - dni, name, email (requeridos por validación server)
 * - address, phone (opcionales)
 * - username, password (opcionales y deben venir juntos para crear la cuenta)
 *
 * Nota: si no se envían username+password, solo se crea el socio (sin usuario).
 */
export type CreatePartnerDTO = {
  dni: string;
  name: string;
  email: string;
  address?: string | null;
  phone?: string | null;
  username?: string | null; // <- opcional (backend lo soporta)
  password?: string | null; // <- opcional (backend lo soporta)
};

export type PatchPartnerDTO = Partial<Omit<CreatePartnerDTO, 'dni'>>;

export type PartnerListResponse = { data: PartnerDTO[] };
export type PartnerItemResponse = { data: PartnerDTO };
