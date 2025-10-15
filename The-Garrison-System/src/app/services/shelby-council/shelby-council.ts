import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ApiResponse, 
  PaginatedResponse,
  ShelbyCouncilDTO, 
  CreateShelbyCouncilDTO, 
  PatchShelbyCouncilDTO 
} from '../../models/shelby-council/shelby-council.model';

@Injectable({ providedIn: 'root' })
export class ShelbyCouncilService {
  private readonly apiUrl = '/api/shelby-council';

  constructor(private http: HttpClient) {}

  /**
   * Lista todos los registros con paginación y filtros opcionales
   * Backend route: GET /api/shelby-council (método getAllConsejosShelby)
   * Query params: page, limit, partnerDni, decisionId
   */
  list(params?: {
    page?: number;
    limit?: number;
    partnerDni?: string;
    decisionId?: number;
  }): Observable<PaginatedResponse<ShelbyCouncilDTO>> {
    let httpParams = new HttpParams();
    
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.partnerDni) httpParams = httpParams.set('partnerDni', params.partnerDni);
    if (params?.decisionId) httpParams = httpParams.set('decisionId', params.decisionId.toString());

    return this.http.get<PaginatedResponse<ShelbyCouncilDTO>>(
      this.apiUrl, 
      { params: httpParams }
    );
  }

  /**
   * Busca registros con filtros específicos
   * Backend route: GET /api/shelby-council/search
   * Query params: partnerDni, decisionId, page, limit
   */
  search(params?: {
    partnerDni?: string;
    decisionId?: number;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<ShelbyCouncilDTO>> {
    let httpParams = new HttpParams();
    
    if (params?.partnerDni) httpParams = httpParams.set('partnerDni', params.partnerDni);
    if (params?.decisionId) httpParams = httpParams.set('decisionId', params.decisionId.toString());
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<PaginatedResponse<ShelbyCouncilDTO>>(
      `${this.apiUrl}/search`, 
      { params: httpParams }
    );
  }

  /**
   * Obtiene un registro por ID
   * Backend route: GET /api/shelby-council/:id
   */
  get(id: number): Observable<ApiResponse<ShelbyCouncilDTO>> {
    return this.http.get<ApiResponse<ShelbyCouncilDTO>>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Crea un nuevo registro
   * Backend route: POST /api/shelby-council
   */
  create(payload: CreateShelbyCouncilDTO): Observable<ApiResponse<ShelbyCouncilDTO>> {
    return this.http.post<ApiResponse<ShelbyCouncilDTO>>(
      this.apiUrl, 
      payload
    );
  }

  /**
   * Actualiza un registro existente
   * Backend route: PUT /api/shelby-council/:id
   */
  update(id: number, payload: PatchShelbyCouncilDTO): Observable<ApiResponse<ShelbyCouncilDTO>> {
    return this.http.put<ApiResponse<ShelbyCouncilDTO>>(
      `${this.apiUrl}/${id}`, 
      payload
    );
  }

  /**
   * Elimina un registro
   * Backend route: DELETE /api/shelby-council/:id
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}