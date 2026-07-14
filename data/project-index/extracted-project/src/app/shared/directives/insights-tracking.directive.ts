import { AfterContentInit, Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { takeUntil, filter } from "rxjs/operators";
import { CustomAnalyticsService } from "src/app/services/custom-analytics.service";
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';


@Directive({
  selector: '[appAnalytics]'
})
export class InsightsTrackingDirective implements AfterContentInit, OnDestroy, OnInit {
  
  @Input('appAnalytics') angularticsOn: string = 'click'; // Default to 'click' event if not specified
  @Input() angularticsAction: string = '';
  @Input() angularticsCategory: string = '';
  @Input() angularticsLabel: string = '';
  @Input() angularticsValue: string = '';
  @Input() angularticsProperties: object = {};
  private unsubscribe: Subscription[] = [];

  private destroy$: Subject<void> = new Subject<void>();
  url: string;
  constructor(
    private elRef: ElementRef,
    private customAnalyticsService: CustomAnalyticsService,
    private renderer: Renderer2,
    private router: Router
  ) {}

  ngOnInit(): void {
    const sub = this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => this.url = event.urlAfterRedirects);

      this.unsubscribe.push(sub);
  }

  ngAfterContentInit(): void {
    this.renderer.listen(this.elRef.nativeElement, this.angularticsOn, (event: Event) =>
      this.eventTrack(event),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  eventTrack(event: Event): void {
    const action = this.angularticsAction || this.inferEventName(event);
    const properties: any = {
      ...this.angularticsProperties,
      eventType: event.type,
      url: this.url,
      category: this.angularticsCategory,
      label: this.angularticsLabel,
      value: this.angularticsValue
    };

    this.customAnalyticsService.trackEvent(action, properties);
  }

  inferEventName(event: Event): string {
    const element = event.target as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type');

    switch (tagName) {
      case 'a':
        return 'clicklink';
      case 'button':
        return type ? `clickbutton${type}` : 'clickbutton';
      case 'input':
        return type ? `input${type}` : 'input';
      default:
        return 'click';
    }
  }
}
