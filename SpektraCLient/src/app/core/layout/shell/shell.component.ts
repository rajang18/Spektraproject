import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  LucideBell,
  LucideChevronDown,
  LucideDynamicIcon,
  LucideFileSearch,
  LucideHistory,
  LucideLayoutDashboard,
  LucideListTodo,
  LucideMessageSquare,
  LucideClipboardCheck,
  LucideLogOut,
  LucideMenu,
  LucideMoon,
  LucideSearch,
  LucideSettings,
  LucideSun,
  LucideTerminal,
  LucideX
} from '@lucide/angular';
import { map } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { AuthStoreService } from '../../auth/auth-store.service';
import { ThemeService } from '../../services/theme.service';
import { NavigationItem } from '../../models/navigation-item.model';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatTooltipModule,
    LucideDynamicIcon,
    LucideBell,
    LucideChevronDown,
    LucideLogOut,
    LucideMenu,
    LucideMoon,
    LucideSearch,
    LucideSettings,
    LucideSun,
    LucideX
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent {
  private readonly authStore = inject(AuthStoreService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly themeService = inject(ThemeService);
  protected readonly theme = this.themeService.theme;

  readonly firstName = this.authStore.firstName;
  readonly email = computed(() => this.authStore.user()?.email ?? '');
  readonly avatarInitial = computed(() => this.firstName().charAt(0).toUpperCase() || '?');

  readonly isHandset = toSignal(
    this.breakpointObserver.observe('(max-width: 620px)').pipe(map((result) => result.matches)),
    { initialValue: false }
  );
  readonly isCompact = toSignal(
    this.breakpointObserver
      .observe('(min-width: 621px) and (max-width: 860px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false }
  );

  readonly isMobileNavOpen = signal(false);
  readonly isUserMenuOpen = signal(false);

  readonly navigationItems: NavigationItem[] = [
    { label: 'Dashboard', icon: LucideLayoutDashboard.icon, route: '/dashboard' },
    { label: 'Requirement to Code', icon: LucideTerminal.icon, route: '/requirement-to-code' },
    { label: 'Knowledge Copilot', icon: LucideMessageSquare.icon, route: '/knowledge-copilot' },
    { label: 'Log Analyzer', icon: LucideFileSearch.icon, route: '/log-analyzer' },
    { label: 'Test Case Generator', icon: LucideClipboardCheck.icon, route: '/test-case-generator' },
    { label: 'Jira Task Generator', icon: LucideListTodo.icon, route: '/jira-generator' },
    { label: 'History', icon: LucideHistory.icon, route: '/history' },
    { label: 'Settings', icon: LucideSettings.icon, route: '/settings' }
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isUserMenuOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isUserMenuOpen.set(false);
    }
  }

  trackByRoute(_index: number, item: NavigationItem) {
    return item.route;
  }

  closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }

  logout(): void {
    this.isUserMenuOpen.set(false);
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
