import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Member, WorkspaceOut } from '../models';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly base = `${environment.apiUrl}/api/workspaces`;

  constructor(private http: HttpClient) {}

  create(name: string, description: string | null): Observable<WorkspaceOut> {
    return this.http.post<WorkspaceOut>(this.base, { name, description });
  }

  update(id: string, name: string, description: string | null): Observable<WorkspaceOut> {
    return this.http.put<WorkspaceOut>(`${this.base}/${id}`, { name, description });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listMembers(workspaceId: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.base}/${workspaceId}/members`);
  }

  addMember(workspaceId: string, email: string, role: string): Observable<Member> {
    return this.http.post<Member>(`${this.base}/${workspaceId}/members`, { email, role });
  }

  changeMemberRole(workspaceId: string, userId: string, role: string): Observable<Member> {
    return this.http.put<Member>(`${this.base}/${workspaceId}/members/${userId}`, { role });
  }

  removeMember(workspaceId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${workspaceId}/members/${userId}`);
  }
}
