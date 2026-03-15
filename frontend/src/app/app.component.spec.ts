import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { AppComponent } from './app.component';
import { CartResponse, CartService } from './core/services/cart.service';
import { AuthService, User } from './core/services/auth.service';
import { Notification, NotificationService } from './core/services/notification.service';
import { UiFeedbackMessage, UiFeedbackService } from './core/services/ui-feedback.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let routerEvents: Subject<NavigationEnd>;
  let currentUserSubject: BehaviorSubject<User | null>;
  let notificationsSubject: BehaviorSubject<Notification[]>;
  let unreadCountSubject: BehaviorSubject<number>;
  let uiMessagesSubject: BehaviorSubject<UiFeedbackMessage[]>;
  let cartService: jasmine.SpyObj<CartService>;
  let authService: jasmine.SpyObj<AuthService> & { currentUser$: Observable<User | null> };
  let notificationService: jasmine.SpyObj<NotificationService> & {
    notifications$: Observable<Notification[]>;
    unreadCount$: Observable<number>;
  };
  let uiFeedbackService: jasmine.SpyObj<UiFeedbackService> & { messages$: Observable<UiFeedbackMessage[]> };
  let router: jasmine.SpyObj<Router> & { events: Observable<NavigationEnd> };

  beforeEach(() => {
    routerEvents = new Subject<NavigationEnd>();
    currentUserSubject = new BehaviorSubject<User | null>(null);
    notificationsSubject = new BehaviorSubject<Notification[]>([]);
    unreadCountSubject = new BehaviorSubject<number>(0);
    uiMessagesSubject = new BehaviorSubject<UiFeedbackMessage[]>([]);

    cartService = jasmine.createSpyObj<CartService>('CartService', ['getCart'], {
      cart$: of<CartResponse | null>(null)
    });
    cartService.getCart.and.returnValue(of({
      cartId: 1,
      items: [],
      totalPrice: 0,
      totalItems: 0
    }));

    authService = Object.assign(
      jasmine.createSpyObj<AuthService>('AuthService', ['logout']),
      { currentUser$: currentUserSubject.asObservable() }
    );

    notificationService = Object.assign(
      jasmine.createSpyObj<NotificationService>('NotificationService', ['getUserNotifications', 'markAsRead']),
      {
        notifications$: notificationsSubject.asObservable(),
        unreadCount$: unreadCountSubject.asObservable()
      }
    );
    notificationService.getUserNotifications.and.callFake(() => of(notificationsSubject.value));
    notificationService.markAsRead.and.callFake((id: number) => {
      notificationsSubject.next(
        notificationsSubject.value.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true, read: true }
            : notification
        )
      );
      unreadCountSubject.next(
        notificationsSubject.value.filter((notification) => !notification.read).length
      );
      return of('ok');
    });

    uiFeedbackService = Object.assign(
      jasmine.createSpyObj<UiFeedbackService>('UiFeedbackService', ['dismiss']),
      { messages$: uiMessagesSubject.asObservable() }
    );

    router = Object.assign(
      jasmine.createSpyObj<Router>('Router', ['navigate']),
      { events: routerEvents.asObservable() }
    );

    component = new AppComponent(
      cartService,
      router,
      authService,
      notificationService,
      uiFeedbackService
    );
  });

  it('loads cart and notifications when a user is emitted', () => {
    const notifications: Notification[] = [
      { id: 1, userId: 1, message: 'First', isRead: false, read: false, createdAt: '2024-01-01' },
      { id: 2, userId: 1, message: 'Second', isRead: true, read: true, createdAt: '2024-01-02' }
    ];
    notificationService.getUserNotifications.and.callFake(() => {
      notificationsSubject.next(notifications);
      unreadCountSubject.next(1);
      return of(notifications);
    });

    component.ngOnInit();
    currentUserSubject.next({ id: 7, username: 'buyer', role: 'BUYER', email: 'buyer@example.com' });

    expect(cartService.getCart).toHaveBeenCalledWith(7);
    expect(notificationService.getUserNotifications).toHaveBeenCalledWith('buyer@example.com');
    expect(component.currentUser?.id).toBe(7);
    expect(component.unreadCount).toBe(1);
  });

  it('clears notifications when the notification state is reset', () => {
    component.ngOnInit();
    notificationsSubject.next([
      { id: 1, userId: 1, message: 'First', isRead: false, read: false, createdAt: '2024-01-01' }
    ]);
    unreadCountSubject.next(1);

    currentUserSubject.next(null);
    notificationsSubject.next([]);
    unreadCountSubject.next(0);

    expect(component.notifications).toEqual([]);
    expect(component.unreadCount).toBe(0);
  });

  it('tracks auth routes from router navigation events', () => {
    routerEvents.next(new NavigationEnd(1, '/login', '/login'));
    expect(component.isAuthRoute).toBeTrue();

    routerEvents.next(new NavigationEnd(2, '/buyer/dashboard', '/buyer/dashboard'));
    expect(component.isAuthRoute).toBeFalse();
  });

  it('marks unread notifications as read and decrements the counter', () => {
    const notification: Notification = {
      id: 9,
      userId: 1,
      message: 'Unread',
      isRead: false,
      read: false,
      createdAt: '2024-01-01'
    };

    component.ngOnInit();
    notificationsSubject.next([notification]);
    unreadCountSubject.next(1);

    component.markAsRead(notification);

    expect(notificationService.markAsRead).toHaveBeenCalledWith(9);
    expect(component.notifications[0].read).toBeTrue();
    expect(component.unreadCount).toBe(0);
  });

  it('opens the search input on first toggle and navigates on second toggle with a query', () => {
    component.toggleSearch();
    expect(component.searchOpen).toBeTrue();

    component.searchQuery = 'phone';
    component.toggleSearch();

    expect(router.navigate).toHaveBeenCalledWith(['/buyer/search'], {
      queryParams: { q: 'phone' }
    });
    expect(component.searchOpen).toBeFalse();
    expect(component.searchQuery).toBe('');
  });

  it('returns the expected logo route for each user state', () => {
    component.isAuthRoute = true;
    component.currentUser = null;
    expect(component.logoRoute).toBeNull();

    component.isAuthRoute = false;
    component.currentUser = { id: 1, username: 'seller', role: 'SELLER' };
    expect(component.logoRoute).toBe('/seller/dashboard');

    component.currentUser = { id: 2, username: 'buyer', role: 'BUYER' };
    expect(component.logoRoute).toBe('/buyer/dashboard');
  });

  it('dismisses a UI message through the feedback service', () => {
    component.dismissUiMessage(42);
    expect(uiFeedbackService.dismiss).toHaveBeenCalledWith(42);
  });
});
