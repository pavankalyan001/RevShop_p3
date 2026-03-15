import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationsStateActions } from '../store/app-state.actions';
import { AppState } from '../store/app-state.models';
import { selectNotifications, selectUnreadNotificationsCount } from '../store/app-state.selectors';

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
    readonly notifications$: Observable<Notification[]>;
    readonly unreadCount$: Observable<number>;

    constructor(private http: HttpClient, private store: Store<AppState>) {
        this.notifications$ = this.store.select(selectNotifications);
        this.unreadCount$ = this.store.select(selectUnreadNotificationsCount);
    }

    getUserNotifications(_email: string): Observable<Notification[]> {
        return this.http.get<any[]>(this.baseUrl).pipe(
            map((notifications) => notifications.map((n) => this.normalizeNotification(n))),
            tap((notifications) => this.store.dispatch(NotificationsStateActions.setNotifications({ notifications })))
        );
    }

    getUnreadNotifications(_email: string): Observable<Notification[]> {
        return this.http.get<any[]>(`${this.baseUrl}/unread`).pipe(
            map((notifications) => notifications.map((n) => this.normalizeNotification(n)))
        );
    }

    markAsRead(id: number): Observable<any> {
        return this.http.put(`${this.baseUrl}/${id}/read`, {}, { responseType: 'text' }).pipe(
            tap(() => this.store.dispatch(NotificationsStateActions.markAsRead({ id })))
        );
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
