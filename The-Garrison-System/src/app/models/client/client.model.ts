// src/app/models/client/client.model.ts
import { SaleDTO } from '../../models/sale/sale.model';

export interface ClientDTO {
  dni:       string;
  name:    string;
  email?:    string;
  address?: string;
  phone?:  string;
  purchaseHistory: SaleDTO[];    
}

export interface ApiResponse<T> {
  data: T;
}