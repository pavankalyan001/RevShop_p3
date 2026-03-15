import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads user notifications and normalizes read flags', () => {
    service.getUserNotifications('buyer@example.com').subscribe(notifications => {
      expect(notifications.length).toBe(1);
      expect(notifications[0].read).toBeTrue();
      expect(notifications[0].isRead).toBeTrue();
    });

    const request = httpMock.expectOne('http://localhost:8080/api/notifications');
    request.flush([
      { id: 1, userId: 4, message: 'Order updated', read: true }
    ]);
  });

  it('loads unread notifications and marks them as read', () => {
    service.getUnreadNotifications('buyer@example.com').subscribe(notifications => {
      expect(notifications.length).toBe(1);
    });
    service.markAsRead(8).subscribe();

    httpMock.expectOne('http://localhost:8080/api/notifications/unread').flush([
      { id: 8, userId: 4, message: 'New alert', isRead: false }
    ]);
    httpMock.expectOne('http://localhost:8080/api/notifications/8/read').flush('ok');
  });
});
