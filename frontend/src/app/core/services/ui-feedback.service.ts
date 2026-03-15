import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type UiFeedbackTone = 'success' | 'error' | 'info';

export interface UiFeedbackMessage {
  id: number;
  text: string;
  tone: UiFeedbackTone;
}

@Injectable({
  providedIn: 'root'
})
export class UiFeedbackService {
  private readonly messagesSubject = new BehaviorSubject<UiFeedbackMessage[]>([]);

  readonly messages$ = this.messagesSubject.asObservable();

  success(text: string, durationMs = 4000): void {
    this.show('success', text, durationMs);
  }

  error(text: string, durationMs = 5000): void {
    this.show('error', text, durationMs);
  }

  info(text: string, durationMs = 4000): void {
    this.show('info', text, durationMs);
  }

  dismiss(id: number): void {
    this.messagesSubject.next(
      this.messagesSubject.value.filter(message => message.id !== id)
    );
  }

  private show(tone: UiFeedbackTone, text: string, durationMs: number): void {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    this.messagesSubject.next([
      ...this.messagesSubject.value,
      { id, text, tone }
    ]);

    if (durationMs > 0) {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
