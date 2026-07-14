import { Directive, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CustomAnalyticsService } from 'src/app/services/custom-analytics.service';

@Directive({
  selector: '[appPageTracking]'
})
export class PageTrackingDirective implements OnInit, OnDestroy {

  private navigationSubscription: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private customAnalyticsService: CustomAnalyticsService
  ) {
  }

  ngOnInit(): void {
    this.navigationSubscription = this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.trackPage(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  private trackPage(path: string): void {
    this.customAnalyticsService.trackPage(path);
  }
}
