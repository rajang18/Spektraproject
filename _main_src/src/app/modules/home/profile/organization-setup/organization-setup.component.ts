import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-organization-setup',
  templateUrl: './organization-setup.component.html',
  styleUrl: './organization-setup.component.scss'
})
export class OrganizationSetupComponent {
  activeTab: string = 'sites';
  private _destroying$ = new Subject<void>();
  _subscription: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateActiveTab(this.router.url);
    this._subscription = this.router.events.pipe(
    takeUntil(this._destroying$))
    .subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateActiveTab(event.urlAfterRedirects);
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {  
    this._destroying$.next();
    this._destroying$.complete();
    this._subscription?.unsubscribe();
  }


  private updateActiveTab(url: string) {
    if (url.includes('sites')) {
      this.activeTab = 'sites';
    } else if (url.includes('departments')) {
      this.activeTab = 'departments';
    }
  }
}
