import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { NotificationService } from './notification.service';
import { appReducers } from '../store/app-state.reducer';
import { UiFeedbackService } from './ui-feedback.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  let uiFeedbackService: jasmine.SpyObj<UiFeedbackService>;

  beforeEach(() => {
    uiFeedbackService = jasmine.createSpyObj<UiFeedbackService>('UiFeedbackService', ['info']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, StoreModule.forRoot(appReducers)],
      providers: [
        { provide: UiFeedbackService, useValue: uiFeedbackService }
      ]
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
