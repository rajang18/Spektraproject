import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  LucideMail,
  LucideLock,
  LucideEye,
  LucideEyeOff,
  LucideSun,
  LucideMoon,
  LucideShieldCheck,
  LucideArrowRight,
  LucideSparkles,
  LucideZap,
  LucideBoxes
} from '@lucide/angular';
import { AuthService } from '@core/auth/auth.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideMail,
    LucideLock,
    LucideEye,
    LucideEyeOff,
    LucideSun,
    LucideMoon,
    LucideShieldCheck,
    LucideArrowRight,
    LucideSparkles,
    LucideZap,
    LucideBoxes
  ],
  template: `
    <section class="login-page">
      <button
        type="button"
        class="theme-toggle"
        aria-label="Toggle color theme"
        [attr.aria-pressed]="theme() === 'dark'"
        (click)="themeService.toggle()"
      >
        @if (theme() === 'dark') {
          <svg lucideSun [size]="18"></svg>
        } @else {
          <svg lucideMoon [size]="18"></svg>
        }
      </button>

      <div class="login-shell">
        <aside class="login-hero">
          <div class="login-hero__glow login-hero__glow--a"></div>
          <div class="login-hero__glow login-hero__glow--b"></div>

          <div class="login-hero__content">
            <div class="login-brand">
              <div class="login-brand__logo">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div>
                <span class="login-brand__title">Spektra AI</span>
                <span class="login-brand__subtitle">Engineering Copilot</span>
              </div>
            </div>

            <h1 class="login-hero__headline">
              Ship faster with your AI-powered engineering copilot.
            </h1>
            <p class="login-hero__copy">
              Convert requirements into code, analyze logs, generate test cases, and plan Jira
              tasks — all from one unified workspace.
            </p>

            <ul class="login-hero__features">
              <li>
                <span class="login-hero__feature-icon"><svg lucideSparkles [size]="16"></svg></span>
                AI-assisted requirement to code generation
              </li>
              <li>
                <span class="login-hero__feature-icon"><svg lucideZap [size]="16"></svg></span>
                Instant root-cause analysis on error logs
              </li>
              <li>
                <span class="login-hero__feature-icon"><svg lucideBoxes [size]="16"></svg></span>
                Automated test cases and Jira tasks
              </li>
            </ul>
          </div>
        </aside>

        <div class="login-form-side">
          <div class="login-card glass-surface">
            <div class="login-brand login-brand--compact">
              <div class="login-brand__logo">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div>
                <span class="login-brand__title">Spektra AI</span>
                <span class="login-brand__subtitle">Engineering Copilot</span>
              </div>
            </div>

            <h2>Welcome back</h2>
            <p class="login-card__subtitle">Sign in with your email and password to continue.</p>

            <form class="login-form" [formGroup]="form" (ngSubmit)="signIn()">
              <label class="input-group" [class.input-group--invalid]="isTouchedInvalid('email')">
                <span class="field-label">Email</span>
                <span class="input-field">
                  <svg lucideMail [size]="17" class="input-field__icon"></svg>
                  <input
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    placeholder="you@spektrasystems.com"
                  />
                </span>
              </label>

              <label class="input-group" [class.input-group--invalid]="isTouchedInvalid('password')">
                <span class="field-label">Password</span>
                <span class="input-field">
                  <svg lucideLock [size]="17" class="input-field__icon"></svg>
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    formControlName="password"
                    autocomplete="current-password"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    class="input-field__toggle"
                    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                    (click)="showPassword.set(!showPassword())"
                  >
                    @if (showPassword()) {
                      <svg lucideEyeOff [size]="17"></svg>
                    } @else {
                      <svg lucideEye [size]="17"></svg>
                    }
                  </button>
                </span>
              </label>

              @if (errorMessage()) {
                <p class="login-error" role="alert">{{ errorMessage() }}</p>
              }

              <button
                class="submit-button"
                type="submit"
                [disabled]="form.invalid || isLoading()"
              >
                @if (isLoading()) {
                  <span class="spinner" aria-hidden="true"></span>
                  <span>Signing in…</span>
                } @else {
                  <span>Sign in</span>
                  <svg lucideArrowRight [size]="17"></svg>
                }
              </button>
            </form>

            <p class="login-trust">
              <svg lucideShieldCheck [size]="14"></svg>
              Your credentials are encrypted and never shared.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host {
      display: block;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
    }`,
    `.login-page {
      position: relative;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
      background: var(--bg);
    }`,
    `.theme-toggle {
      position: absolute;
      top: 18px;
      right: 18px;
      z-index: 5;
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--ink);
      cursor: pointer;
      box-shadow: var(--shadow);
      transition:
        transform 160ms ease,
        background 160ms ease;
    }`,
    '.theme-toggle:hover { transform: translateY(-1px); }',
    '.theme-toggle:active { transform: translateY(0); }',
    `.login-shell {
      height: 100%;
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    }`,
    `.login-hero {
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      padding: clamp(28px, 5vw, 72px);
      background: linear-gradient(160deg, var(--nav) 0%, var(--nav-2) 55%, #1a1040 130%);
      color: #f5f3ff;
    }`,
    `.login-hero__glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(70px);
      opacity: 0.55;
      pointer-events: none;
    }`,
    `.login-hero__glow--a {
      width: 360px;
      height: 360px;
      top: -80px;
      left: -60px;
      background: radial-gradient(circle, #7c45f5, transparent 70%);
    }`,
    `.login-hero__glow--b {
      width: 320px;
      height: 320px;
      bottom: -100px;
      right: -60px;
      background: radial-gradient(circle, #27c5c3, transparent 70%);
    }`,
    '.login-hero__content { position: relative; max-width: 460px; }',
    `.login-hero__headline {
      margin: clamp(20px, 4vh, 40px) 0 14px;
      font-size: clamp(1.5rem, 2.6vw, 2.1rem);
      font-weight: 800;
      line-height: 1.25;
      color: #fff;
    }`,
    '.login-hero__copy { margin: 0 0 26px; color: #cad2ef; font-size: 0.95rem; line-height: 1.6; }',
    '.login-hero__features { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }',
    `.login-hero__features li {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.88rem;
      color: #e4e7fb;
    }`,
    `.login-hero__feature-icon {
      width: 30px;
      height: 30px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 9px;
      background: rgba(255, 255, 255, 0.1);
      color: #cdb8ff;
    }`,
    `.login-form-side {
      display: grid;
      place-items: center;
      padding: clamp(16px, 4vw, 32px);
      overflow-y: auto;
    }`,
    `.login-card {
      width: min(420px, 100%);
      box-sizing: border-box;
      border-radius: 16px;
      box-shadow: var(--shadow);
      padding: clamp(22px, 4vh, 36px);
    }`,
    `.login-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: clamp(16px, 4vh, 28px);
    }`,
    '.login-brand--compact { display: none; }',
    `.login-brand__logo {
      width: 36px;
      height: 36px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px;
      flex-shrink: 0;
    }`,
    '.login-brand__logo span { border-radius: 5px; }',
    '.login-brand__logo span:nth-child(1) { background: #7c45f5; }',
    '.login-brand__logo span:nth-child(2) { background: #27c5c3; }',
    '.login-brand__logo span:nth-child(3) { background: #e263d8; }',
    '.login-brand__logo span:nth-child(4) { background: #7c45f5; }',
    '.login-brand__title { display: block; font-size: 0.95rem; font-weight: 850; color: var(--ink); }',
    '.login-brand__subtitle { display: block; font-size: 0.7rem; color: var(--muted); }',
    'h2 { margin: 0 0 4px; font-size: 1.5rem; font-weight: 800; color: var(--ink); }',
    '.login-card__subtitle { margin: 0 0 clamp(16px, 3vh, 24px); color: var(--muted); font-size: 0.88rem; }',
    '.login-form { display: grid; gap: clamp(12px, 2.4vh, 16px); }',
    '.field-label { display: block; margin: 0 0 6px; font-size: 0.8rem; font-weight: 750; color: var(--ink); }',
    `.input-field {
      position: relative;
      display: flex;
      align-items: center;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: var(--panel);
      transition:
        border-color 150ms ease,
        box-shadow 150ms ease;
    }`,
    '.input-field:focus-within { border-color: var(--purple); box-shadow: 0 0 0 4px var(--ring); }',
    '.input-group--invalid .input-field { border-color: var(--red); }',
    `.input-field__icon {
      margin-left: 12px;
      color: var(--muted);
      flex-shrink: 0;
    }`,
    `.input-field input {
      flex: 1;
      min-width: 0;
      border: 0;
      background: transparent;
      color: var(--ink);
      outline: none;
      min-height: 42px;
      padding: 0 12px;
      font-size: 0.92rem;
    }`,
    `.input-field__toggle {
      border: 0;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      padding: 0 12px;
      height: 42px;
      display: grid;
      place-items: center;
    }`,
    '.input-field__toggle:hover { color: var(--ink); }',
    '.login-error { margin: 0; padding: 10px 12px; border-radius: 8px; background: rgba(248, 113, 113, 0.12); color: var(--red); font-size: 0.82rem; font-weight: 600; }',
    `.submit-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      min-height: 44px;
      margin-top: 4px;
      border: 0;
      border-radius: 10px;
      background: linear-gradient(135deg, #8d55ff, #7238ee);
      color: #fff;
      font-weight: 750;
      font-size: 0.92rem;
      cursor: pointer;
      box-shadow: 0 12px 26px rgba(124, 69, 245, 0.32);
      transition:
        transform 150ms ease,
        box-shadow 150ms ease,
        opacity 150ms ease;
    }`,
    '.submit-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 16px 32px rgba(124, 69, 245, 0.4); }',
    '.submit-button:active:not(:disabled) { transform: translateY(0); }',
    '.submit-button:disabled { opacity: 0.7; cursor: not-allowed; box-shadow: none; }',
    `.spinner {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      animation: spin 700ms linear infinite;
    }`,
    '@keyframes spin { to { transform: rotate(360deg); } }',
    `.login-trust {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 20px 0 0;
      color: var(--muted);
      font-size: 0.74rem;
    }`,
    `@media (max-width: 900px) {
      .login-shell { grid-template-columns: 1fr; }
      .login-hero { display: none; }
      .login-brand--compact { display: flex; }
    }`,
    `@media (max-width: 480px) {
      .login-card { border-radius: 14px; }
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly themeService = inject(ThemeService);
  protected readonly theme = this.themeService.theme;

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  isTouchedInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  signIn(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message ?? 'Email or password does not exist. Please try again.'
        );
      }
    });
  }
}
