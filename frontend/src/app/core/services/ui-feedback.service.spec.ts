import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { UiFeedbackService } from './ui-feedback.service';
import { appReducers } from '../store/app-state.reducer';

describe('UiFeedbackService', () => {
  let service: UiFeedbackService;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot(appReducers)]
    });
    service = TestBed.inject(UiFeedbackService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('adds a success message and auto-dismisses it after the timeout', () => {
    let messagesCount = 0;
    service.messages$.subscribe(messages => {
      messagesCount = messages.length;
    });

    service.success('Saved', 1000);
    expect(messagesCount).toBe(1);

    jasmine.clock().tick(1001);
    expect(messagesCount).toBe(0);
  });

  it('dismisses a message manually by id', () => {
    let latestIds: number[] = [];
    service.messages$.subscribe(messages => {
      latestIds = messages.map(message => message.id);
    });

    service.error('Failed', 0);
    expect(latestIds.length).toBe(1);

    service.dismiss(latestIds[0]);
    expect(latestIds).toEqual([]);
  });
});
