import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, MonthlyReviewDTO, CreateMonthlyReviewDTO, PatchMonthlyReviewDTO, SalesStatsItem } from '../../models/monthly-review/monthly-review.model';

@Injectable({ providedIn: 'root' })
export class MonthlyReviewService {
  private readonly apiUrl = '/api/monthly-reviews';

  constructor(private http: HttpClient) {}

  search(params?: { year?: number; month?: number; status?: string }): Observable<ApiResponse<MonthlyReviewDTO[]>> {
    let p = new HttpParams();
    if (params?.year   != null) p = p.set('year', String(params.year));
    if (params?.month  != null) p = p.set('month', String(params.month));
    if (params?.status != null) p = p.set('status', params.status);
    return this.http.get<ApiResponse<MonthlyReviewDTO[]>>(`${this.apiUrl}/search`, { params: p });
  }

  list(): Observable<ApiResponse<MonthlyReviewDTO[]>> {
    return this.http.get<ApiResponse<MonthlyReviewDTO[]>>(this.apiUrl);
  }

  stats(year: number, month?: number, groupBy?: 'distributor'|'product'|'client'|'day'|'zone'): Observable<ApiResponse<SalesStatsItem[]>> {
    let p = new HttpParams().set('year', String(year));
    if (month != null)   p = p.set('month', String(month));
    if (groupBy)         p = p.set('groupBy', groupBy);
    return this.http.get<ApiResponse<SalesStatsItem[]>>(`${this.apiUrl}/statistics`, { params: p });
  }

  get(id: number): Observable<ApiResponse<MonthlyReviewDTO>> {
    return this.http.get<ApiResponse<MonthlyReviewDTO>>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateMonthlyReviewDTO): Observable<ApiResponse<MonthlyReviewDTO>> {
    return this.http.post<ApiResponse<MonthlyReviewDTO>>(this.apiUrl, payload);
  }

  update(id: number, payload: PatchMonthlyReviewDTO): Observable<ApiResponse<MonthlyReviewDTO>> {
    return this.http.patch<ApiResponse<MonthlyReviewDTO>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
