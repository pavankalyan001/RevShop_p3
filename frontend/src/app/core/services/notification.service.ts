import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationsStateActions } from '../store/app-state.actions';
import { AppState } from '../store/app-state.models';
import { selectNotifications, selectUnreadNotificationsCount } from '../store/app-state.selectors';
import { UiFeedbackService } from './ui-feedback.service';

export interface Notification {
    id: number;
    userId: number;
    message: string;
    isRead: boolean;
    read: boolean;
    type?: string;
    referenceId?: number;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private baseUrl = `${environment.apiBaseUrl}/notifications`;
    private socket: WebSocket | null = null;
    private reconnectTimeoutId: number | null = null;
    private lastToken: string | null = null;
    readonly notifications$: Observable<Notification[]>;
    readonly unreadCount$: Observable<number>;

    constructor(
        private http: HttpClient,
        private store: Store<AppState>,
        private uiFeedbackService: UiFeedbackService
    ) {
        this.notifications$ = this.store.select(selectNotifications);
        this.unreadCount$ = this.store.select(selectUnreadNotificationsCount);
    }

    connect(token: string | null): void {
        if (!token) {
            this.disconnect();
            return;
        }

        if (this.socket?.readyState === WebSocket.OPEN && this.lastToken === token) {
            return;
        }

        this.disconnect(false);
        this.lastToken = token;

        try {
            this.socket = new WebSocket(this.buildSocketUrl(token));
        } catch {
            this.scheduleReconnect();
            return;
        }

        this.socket.onmessage = (event) => {
            let payload: unknown;
            try {
                payload = JSON.parse(event.data);
            } catch {
                return;
            }

            const notification = this.normalizeNotification(payload);
            this.store.dispatch(NotificationsStateActions.addNotification({ notification }));
            this.uiFeedbackService.info(notification.message, 5000);
        };

        this.socket.onclose = () => {
            this.socket = null;
            this.scheduleReconnect();
        };

        this.socket.onerror = () => {
            this.socket?.close();
        };
    }

    disconnect(clearToken = true): void {
        if (this.reconnectTimeoutId !== null) {
            window.clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }

        if (clearToken) {
            this.lastToken = null;
        }

        if (this.socket) {
            this.socket.onclose = null;
            this.socket.onerror = null;
            this.socket.onmessage = null;
            this.socket.close();
            this.socket = null;
        }
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
            type: notification?.type,
            referenceId: Number(notification?.referenceId ?? 0) || undefined,
            createdAt: notification?.createdAt ?? new Date().toISOString()
        };
    }

    private buildSocketUrl(token: string): string {
        return `${environment.apiBaseUrl.replace(/^http/, 'ws').replace(/\/api$/, '')}/ws/notifications?token=${encodeURIComponent(token)}`;
    }

    private scheduleReconnect(): void {
        if (!this.lastToken || this.reconnectTimeoutId !== null) {
            return;
        }

        this.reconnectTimeoutId = window.setTimeout(() => {
            this.reconnectTimeoutId = null;
            this.connect(this.lastToken);
        }, 3000);
    }
}
