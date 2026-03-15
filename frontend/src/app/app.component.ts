import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { AuthService, User } from './core/services/auth.service';
import { NotificationService, Notification } from './core/services/notification.service';
import { UiFeedbackMessage, UiFeedbackService } from './core/services/ui-feedback.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'frontend';

  searchOpen = false;
  searchQuery = '';

  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;

  currentUser: User | null = null;
  uiMessages: UiFeedbackMessage[] = [];

  // Hardcoded for now, same as in CartComponent for the seeder
  private userId!: number;

  isAuthRoute = false;

  constructor(
    public cartService: CartService,
    private router: Router,
    public authService: AuthService,
    private notificationService: NotificationService,
    private uiFeedbackService: UiFeedbackService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isAuthRoute = event.urlAfterRedirects.includes('/login') || event.urlAfterRedirects.includes('/forgot-password');
      }
    });
  }

  ngOnInit(): void {
    this.uiFeedbackService.messages$.subscribe(messages => {
      this.uiMessages = messages;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        // Fetch specific cart using user.id once Backend syncs cart properly to user ID.
        this.cartService.getCart(user.id).subscribe();
        this.loadNotifications(user.email!);
      } else {
        this.notifications = [];
        this.unreadCount = 0;
      }
    });

  }

  loadNotifications(email: string) {
    this.notificationService.getUserNotifications(email).subscribe(data => {
      this.notifications = data;
      this.unreadCount = data.filter(n => !n.read).length;
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(n: Notification) {
    if (!n.read) {
      this.notificationService.markAsRead(n.id).subscribe(() => {
        n.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSearch(): void {
    if (this.searchOpen && this.searchQuery.trim()) {
      this.doSearch();
    } else {
      this.searchOpen = !this.searchOpen;
    }
  }

  get logoRoute(): string | null {
    if (!this.currentUser && this.isAuthRoute) {
      return null;
    }
    if (this.currentUser?.role === 'SELLER') {
      return '/seller/dashboard';
    }
    if (this.currentUser) {
      return '/buyer/dashboard';
    }
    return '/login';
  }

  onLogoClick(event: MouseEvent): void {
    if (!this.logoRoute) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  doSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/buyer/search'], {
        queryParams: { q: this.searchQuery.trim() }
      });
      this.searchOpen = false;
      this.searchQuery = '';
    }
  }

  dismissUiMessage(id: number): void {
    this.uiFeedbackService.dismiss(id);
  }
}
