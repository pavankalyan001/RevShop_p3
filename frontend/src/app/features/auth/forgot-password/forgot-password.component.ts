import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  resetForm!: FormGroup;

  message = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      token: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  requestResetToken() {
    if (this.resetForm.get('email')?.invalid) {
      this.resetForm.get('email')?.markAsTouched();
      return;
    }

    const email = this.resetForm.value.email;
    this.authService.forgotPassword({ email }).subscribe({
      next: (res: any) => {
        this.message = typeof res === 'string' ? res : 'Reset token generated. Check your email.';
        this.error = '';
      },
      error: (err: any) => {
        this.error = this.extractErrorMessage(err, 'Could not generate reset token');
        this.message = '';
      }
    });
  }

  resetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const email = this.resetForm.value.email;
    const token = this.resetForm.value.token;
    const newPassword = this.resetForm.value.newPassword;
    const confirmPassword = this.resetForm.value.confirmPassword;

    if (newPassword !== confirmPassword) {
      this.error = 'Passwords do not match.';
      this.message = '';
      return;
    }

    const payload = {
      email,
      token,
      newPassword
    };

    this.authService.resetPassword(payload)
      .subscribe({
        next: (res: any) => {
          this.message = typeof res === 'string' ? res : 'Password reset successful.';
          this.error = '';
        },
        error: (err: any) => {
          this.error = this.extractErrorMessage(err, 'Something went wrong. Please try again.');
          this.message = '';
        }
      });
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }
    if (typeof err?.error?.message === 'string' && err.error.message.trim()) {
      return err.error.message;
    }
    if (typeof err?.message === 'string' && err.message.trim()) {
      return err.message;
    }
    return fallback;
  }
}
