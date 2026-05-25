import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Project } from '../models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly base = `${environment.apiUrl}/api/projects`;

  constructor(private http: HttpClient) {}

  list(): Observable<Project[]> {
    return this.http.get<Project[]>(this.base);
  }

  create(name: string, description: string): Observable<Project> {
    return this.http.post<Project>(this.base, { name, description });
  }

  update(id: string, name: string, description: string): Observable<Project> {
    return this.http.put<Project>(`${this.base}/${id}`, { name, description });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
