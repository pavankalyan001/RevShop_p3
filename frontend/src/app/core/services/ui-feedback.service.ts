import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../store/app-state.models';
import { UiFeedbackStateActions } from '../store/app-state.actions';
import { selectUiMessages } from '../store/app-state.selectors';

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
  readonly messages$: Observable<UiFeedbackMessage[]>;

  constructor(private store: Store<AppState>) {
    this.messages$ = this.store.select(selectUiMessages);
  }

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
    this.store.dispatch(UiFeedbackStateActions.dismissMessage({ id }));
  }

  private show(tone: UiFeedbackTone, text: string, durationMs: number): void {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    this.store.dispatch(UiFeedbackStateActions.addMessage({
      message: { id, text, tone }
    }));

    if (durationMs > 0) {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
