import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { GraphqlService } from '../core/graphql.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth-page">
      <section class="auth-panel">
        <h1>Signup</h1>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <label>
            Username
            <input type="text" formControlName="username" placeholder="Your name" />
            @if (form.controls.username.touched && form.controls.username.invalid) {
              <span class="field-error">Username is required.</span>
            }
          </label>

          <label>
            Email
            <input type="email" formControlName="email" placeholder="name@example.com" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="field-error">Enter a valid email.</span>
            }
          </label>

          <label>
            Password
            <input type="password" formControlName="password" placeholder="Minimum 6 characters" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <span class="field-error">Use at least 6 characters.</span>
            }
          </label>

          @if (error) {
            <p class="alert">{{ error }}</p>
          }

          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating account...' : 'Signup' }}
          </button>
        </form>

        <p>Already registered? <a routerLink="/login">Login</a></p>
      </section>
    </main>
  `,
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(GraphqlService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const payload = await this.api.signup(
        this.form.value.username ?? '',
        this.form.value.email ?? '',
        this.form.value.password ?? '',
      );
      this.auth.saveSession(payload);
      await this.router.navigate(['/employees']);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Signup failed.';
    } finally {
      this.loading = false;
    }
  }
}
