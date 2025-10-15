import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ApiResponse, 
  PaginatedResponse,
  MonthlyReviewDTO, 
  CreateMonthlyReviewDTO, 
  PatchMonthlyReviewDTO,
  SalesStatisticsResponse
} from '../../models/monthly-review/monthly-review.model';

@Injectable({ providedIn: 'root' })
export class MonthlyReviewService {
  private readonly apiUrl = '/api/monthly-reviews';

  constructor(private http: HttpClient) {}

  /**
   * Busca revisiones mensuales con filtros
   * Backend route: GET /api/monthly-reviews/search
   * Query params: year, month, status, partnerDni, page, limit
   */
  search(params?: {
    year?: number;
    month?: number;
    status?: string;
    partnerDni?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<MonthlyReviewDTO>> {
    let httpParams = new HttpParams();
    
    if (params?.year) httpParams = httpParams.set('year', params.year.toString());
    if (params?.month) httpParams = httpParams.set('month', params.month.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.partnerDni) httpParams = httpParams.set('partnerDni', params.partnerDni);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<PaginatedResponse<MonthlyReviewDTO>>(
      `${this.apiUrl}/search`,
      { params: httpParams }
    );
  }

  /**
   * Lista todas las revisiones mensuales con paginación
   * Backend route: GET /api/monthly-reviews
   */
  list(params?: {
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<MonthlyReviewDTO>> {
    let httpParams = new HttpParams();
    
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<PaginatedResponse<MonthlyReviewDTO>>(
      this.apiUrl,
      { params: httpParams }
    );
  }

  /**
   * Obtiene estadísticas de ventas
   * Backend route: GET /api/monthly-reviews/statistics
   * Query params: year (required), month (optional), groupBy (optional)
   */
  statistics(params: {
    year: number;
    month?: number;
    groupBy?: 'distributor' | 'product' | 'client' | 'day' | 'zone';
  }): Observable<ApiResponse<SalesStatisticsResponse>> {
    let httpParams = new HttpParams().set('year', params.year.toString());
    
    if (params.month) httpParams = httpParams.set('month', params.month.toString());
    if (params.groupBy) httpParams = httpParams.set('groupBy', params.groupBy);

    return this.http.get<ApiResponse<SalesStatisticsResponse>>(
      `${this.apiUrl}/statistics`,
      { params: httpParams }
    );
  }

  /**
   * Obtiene una revisión mensual por ID
   * Backend route: GET /api/monthly-reviews/:id
   */
  get(id: number): Observable<ApiResponse<MonthlyReviewDTO>> {
    return this.http.get<ApiResponse<MonthlyReviewDTO>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva revisión mensual
   * Backend route: POST /api/monthly-reviews
   */
  create(payload: CreateMonthlyReviewDTO): Observable<ApiResponse<MonthlyReviewDTO>> {
    return this.http.post<ApiResponse<MonthlyReviewDTO>>(this.apiUrl, payload);
  }

  /**
   * Actualiza una revisión mensual
   * Backend route: PATCH /api/monthly-reviews/:id
   */
  update(id: number, payload: PatchMonthlyReviewDTO): Observable<ApiResponse<MonthlyReviewDTO>> {
    return this.http.patch<ApiResponse<MonthlyReviewDTO>>(
      `${this.apiUrl}/${id}`,
      payload
    );
  }

  /**
   * Elimina una revisión mensual
   * Backend route: DELETE /api/monthly-reviews/:id
   */
  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}