import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
    id: number;
    userId: number;
    message: string;
    isRead: boolean;
    read: boolean;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private baseUrl = `${environment.apiBaseUrl}/notifications`;

    constructor(private http: HttpClient) { }

    getUserNotifications(_email: string): Observable<Notification[]> {
        return this.http.get<any[]>(this.baseUrl).pipe(
            map((notifications) => notifications.map((n) => this.normalizeNotification(n)))
        );
    }

    getUnreadNotifications(_email: string): Observable<Notification[]> {
        return this.http.get<any[]>(`${this.baseUrl}/unread`).pipe(
            map((notifications) => notifications.map((n) => this.normalizeNotification(n)))
        );
    }

    markAsRead(id: number): Observable<any> {
        return this.http.put(`${this.baseUrl}/${id}/read`, {}, { responseType: 'text' });
    }

    private normalizeNotification(notification: any): Notification {
        const isRead = Boolean(notification?.isRead ?? notification?.read ?? false);
        return {
            id: Number(notification?.id ?? 0),
            userId: Number(notification?.userId ?? 0),
            message: notification?.message ?? '',
            isRead,
            read: isRead,
            createdAt: notification?.createdAt ?? new Date().toISOString()
        };
    }
}
