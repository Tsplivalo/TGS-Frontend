import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ApiResponse,
  VentaDTO,
  CreateVentaDTO,
  UpdateVentaDTO,
  VentaDetalleDTO,
} from '../../models/venta/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly apiPlural = '/api/ventas';
  private readonly apiSingular = '/api/venta';

  constructor(private http: HttpClient) {}

  // ===== Helpers con fallback plural⇄singular =====
  private getAllBase(url: string) {
    return this.http.get<ApiResponse<VentaDTO[]>>(url);
  }
  getAllVentas(): Observable<ApiResponse<VentaDTO[]>> {
    return this.getAllBase(this.apiPlural).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.getAllBase(this.apiSingular) : throwError(() => err)
      )
    );
  }

  private postBase(url: string, body: any) {
    return this.http.post<ApiResponse<VentaDTO>>(url, body);
  }
  createVenta(body: CreateVentaDTO): Observable<ApiResponse<VentaDTO>> {
    // Normalizo tipos
    const detalles = (body.detalles || []).map((d: VentaDetalleDTO) => ({
      productoId: Number(d.productoId),
      cantidad: Number(d.cantidad),
    }));

    const payload: CreateVentaDTO = {
      clienteDni: String(body.clienteDni).trim(),
      detalles,
    };

    return this.postBase(this.apiPlural, payload).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.postBase(this.apiSingular, payload) : throwError(() => err)
      )
    );
  }

  private patchBase(url: string, id: number, body: any) {
    return this.http.patch<ApiResponse<VentaDTO>>(`${url}/${id}`, body);
  }
  updateVenta(id: number, body: UpdateVentaDTO): Observable<ApiResponse<VentaDTO>> {
    const payload: UpdateVentaDTO = {};
    if (body.clienteDni != null) payload.clienteDni = String(body.clienteDni).trim();

    if (body.detalles != null) {
      payload.detalles = body.detalles.map(d => ({
        productoId: Number(d.productoId),
        cantidad: Number(d.cantidad),
      }));
    }
    // Compat: si tu back aún acepta productoId/cantidad en PATCH
    if (body.productoId != null) payload.productoId = Number(body.productoId);
    if (body.cantidad != null) payload.cantidad = Number(body.cantidad);

    return this.patchBase(this.apiPlural, id, payload).pipe(
      catchError((err: HttpErrorResponse) =>
        err.status === 404 ? this.patchBase(this.apiSingular, id, payload) : throwError(() => err)
      )
    );
  }


  
}
