import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  ApiResponse,
  SobornoDTO,
  CreateSobornoDTO,
  UpdateSobornoDTO,
  PagarSobornosBody,
} from '../../models/soborno/soborno.model';

@Injectable({ providedIn: 'root' })
export class SobornoService {
  // Endpoints en plural y singular (fallback por si el back está montado distinto)
  private readonly apiUrlPlural = '/api/sobornos';
  private readonly apiUrlSingular = '/api/soborno';

  constructor(private http: HttpClient) {}

  private getAllBase(url: string) {
    return this.http.get<{ sobornos?: SobornoDTO[] } & ApiResponse<SobornoDTO[]>>(url);
  }

  getAll(): Observable<{ sobornos?: SobornoDTO[] } & ApiResponse<SobornoDTO[]>> {
    return this.getAllBase(this.apiUrlPlural).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return this.getAllBase(this.apiUrlSingular);
        }
        return throwError(() => err);
      })
    );
  }

  private getByIdBase(url: string, id: number) {
    return this.http.get<SobornoDTO>(`${url}/${id}`);
  }

  getById(id: number): Observable<SobornoDTO> {
    return this.getByIdBase(this.apiUrlPlural, id).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return this.getByIdBase(this.apiUrlSingular, id);
        }
        return throwError(() => err);
      })
    );
  }

  private postBase(url: string, body: any) {
    return this.http.post<SobornoDTO>(url, body);
  }

  create(body: CreateSobornoDTO): Observable<SobornoDTO> {
    // UI usa autoridadDni, pero el back espera autoridadId (string)
    const payload = {
      monto: Number(body.monto),
      autoridadId: String(body.autoridadDni).trim(),
      ventaId: Number(body.ventaId),
    };

    return this.postBase(this.apiUrlPlural, payload).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          // Fallback a singular
          return this.postBase(this.apiUrlSingular, payload);
        }
        return throwError(() => err);
      })
    );
  }

  private putBase(url: string, id: number, body: any) {
    return this.http.put<SobornoDTO>(`${url}/${id}`, body);
  }

  update(id: number, body: UpdateSobornoDTO): Observable<SobornoDTO> {
    return this.putBase(this.apiUrlPlural, id, body).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return this.putBase(this.apiUrlSingular, id, body);
        }
        return throwError(() => err);
      })
    );
  }

  private patchBase(url: string, path: string, body: any) {
    return this.http.patch<{ message: string }>(`${url}${path}`, body);
  }

  // Marca pagados una lista de sobornos (ruta global)
  pagar(ids: number | number[]): Observable<{ message: string }> {
    const body: PagarSobornosBody = { ids };
    return this.patchBase(this.apiUrlPlural, `/pagar`, body).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return this.patchBase(this.apiUrlSingular, `/pagar`, body);
        }
        return throwError(() => err);
      })
    );
  }

  // Marca pagados por autoridad (tu back usa :id en path; en tu UI pasamos DNI)
  pagarDeAutoridad(dni: string, ids: number | number[]): Observable<{ message: string }> {
    const body: PagarSobornosBody = { ids };
    return this.patchBase(this.apiUrlPlural, `/${dni}/pagar`, body).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return this.patchBase(this.apiUrlSingular, `/${dni}/pagar`, body);
        }
        return throwError(() => err);
      })
    );
  }

  private deleteBase(url: string, id: number) {
    return this.http.delete<{ message: string }>(`${url}/${id}`);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.deleteBase(this.apiUrlPlural, id).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          return this.deleteBase(this.apiUrlSingular, id);
        }
        return throwError(() => err);
      })
    );
  }
}
