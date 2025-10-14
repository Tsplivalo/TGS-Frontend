import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  MonthlyReviewDTO,
  CreateMonthlyReviewDTO,
  PatchMonthlyReviewDTO,
  SalesStatsQuery,
  SalesStatsItem
} from '../../models/monthly-review/monthly-review.model';

type ApiResponse<T = any> = { data: T } | T;

// Por claridad, tomamos el tipo literal de groupBy desde el propio modelo
type GroupBy = NonNullable<SalesStatsQuery['groupBy']>;

@Injectable({ providedIn: 'root' })
export class MonthlyReviewService {
  private readonly apiUrl = '/api/monthly-reviews';

  constructor(private http: HttpClient) {}

  /** Lista general; alias para componentes que esperan list() */
  list(): Observable<MonthlyReviewDTO[]> {
    return this.search();
  }

  /** Búsqueda con filtros (year/month/status) */
  search(params?: { year?: number; month?: number; status?: string }): Observable<MonthlyReviewDTO[]> {
    let p = new HttpParams();
    if (params?.year   != null) p = p.set('year', String(params.year));
    if (params?.month  != null) p = p.set('month', String(params.month));
    if (params?.status != null) p = p.set('status', params.status);

    return this.http.get<ApiResponse<MonthlyReviewDTO[]>>(this.apiUrl, { params: p }).pipe(
      map((res: any) => (res?.data ?? res) as MonthlyReviewDTO[])
    );
  }

  get(id: number): Observable<MonthlyReviewDTO> {
    return this.http.get<ApiResponse<MonthlyReviewDTO>>(`${this.apiUrl}/${id}`).pipe(
      map((res: any) => (res?.data ?? res) as MonthlyReviewDTO)
    );
  }

  /** Type guard para validar el literal de groupBy */
  private isGroupBy(x: any): x is GroupBy {
    return x === 'product' || x === 'distributor' || x === 'client' || x === 'day' || x === 'zone';
  }

  /** Soporte de estadísticas: dos firmas (objeto query o (year, month?, groupBy?)) */
  stats(query: SalesStatsQuery): Observable<SalesStatsItem[]>;
  stats(year: number, month?: number, groupBy?: GroupBy): Observable<SalesStatsItem[]>;
  stats(a: SalesStatsQuery | number, b?: number, c?: GroupBy): Observable<SalesStatsItem[]> {
    const q: SalesStatsQuery =
      typeof a === 'number'
        ? {
            year: a,
            month: (typeof b === 'number' ? b : undefined),
            groupBy: (this.isGroupBy(c) ? c : undefined)
          }
        : a;

    let p = new HttpParams().set('year', String(Number(q.year)));
    if (q.month != null)   p = p.set('month', String(Number(q.month)));
    if (q.groupBy)         p = p.set('groupBy', q.groupBy);

    return this.http.get<ApiResponse<SalesStatsItem[]>>(`${this.apiUrl}/stats`, { params: p }).pipe(
      map((res: any) => (res?.data ?? res) as SalesStatsItem[])
    );
  }

  create(payload: CreateMonthlyReviewDTO): Observable<MonthlyReviewDTO> {
    const body: any = { ...payload };
    body.year = Number(body.year);
    if (body.month != null) body.month = Number(body.month);
    if (body.reviewedByDni != null) body.reviewedByDni = String(body.reviewedByDni);
    return this.http.post<ApiResponse<MonthlyReviewDTO>>(this.apiUrl, body).pipe(
      map((res: any) => (res?.data ?? res) as MonthlyReviewDTO)
    );
  }

  update(id: number, payload: PatchMonthlyReviewDTO): Observable<MonthlyReviewDTO> {
    const body: any = { ...payload };
    if (body.year != null) body.year = Number(body.year);
    if (body.month != null) body.month = Number(body.month);
    if (body.reviewedByDni != null) body.reviewedByDni = String(body.reviewedByDni);
    if (body.status != null) body.status = String(body.status);
    return this.http.patch<ApiResponse<MonthlyReviewDTO>>(`${this.apiUrl}/${id}`, body).pipe(
      map((res: any) => (res?.data ?? res) as MonthlyReviewDTO)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
