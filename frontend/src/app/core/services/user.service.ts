import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  register(email: string, password: string, fullName: string): Observable<User> {
    return this.http.post<User>(`${this.base}/auth/register`, {
      email,
      password,
      full_name: fullName,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/users/me/password`, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  searchByEmail(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users/search`, { params: { q: query } });
  }
}
