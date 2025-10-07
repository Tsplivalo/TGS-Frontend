import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ApiResponse,
  TopicDTO,
  CreateTopicDTO,
  UpdateTopicDTO,
} from '../../models/topic/topic.model';


@Injectable({ providedIn: 'root' })
export class TopicService {
  private readonly apiUrl = '/api/topics';

  constructor(private http: HttpClient) {}


  getAll(): Observable<ApiResponse<TopicDTO[]>> {
    return this.http.get<ApiResponse<TopicDTO[]>>(this.apiUrl);
  }


  getById(id: number): Observable<ApiResponse<TopicDTO>> {
    return this.http.get<ApiResponse<TopicDTO>>(`${this.apiUrl}/${id}`);
  }


  create(body: CreateTopicDTO): Observable<ApiResponse<TopicDTO>> {
    return this.http.post<ApiResponse<TopicDTO>>(this.apiUrl, body);
  }


  update(id: number, body: UpdateTopicDTO): Observable<ApiResponse<TopicDTO>> {
    // backend exposes partial PATCH
    return this.http.patch<ApiResponse<TopicDTO>>(`${this.apiUrl}/${id}`, body);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
