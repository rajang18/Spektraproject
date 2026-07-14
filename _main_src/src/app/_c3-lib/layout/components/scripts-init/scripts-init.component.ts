import { Component, OnDestroy, OnInit } from '@angular/core';
import { ResolveEnd, Router } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { LayoutService } from '../../core/layout.service';
import { PageInfoService } from '../../core/page-info.service';
import { Title } from '@angular/platform-browser';
import { SellDirectRoutes, SellIndirectRoutes } from 'src/app/shared/models/breadcrumbs.model';
import {
  ToggleComponent,
  ScrollTopComponent,
  DrawerComponent,
  StickyComponent,
  MenuComponent,
  ScrollComponent,
} from '../../../kt/components';

@Component({
  selector: 'app-scripts-init',
  templateUrl: './scripts-init.component.html',
})
export class ScriptsInitComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];
  private _destroying$ = new Subject<void>();
  private annonymousRoutes: string[] = ['renewalmanager','/customer/products','/customer/productsequence','/customer/orders','/customer/shop', '/home/users', '/renewalmanager'];
  constructor(
    private layout: LayoutService,
    private pageInfo: PageInfoService,
    private router: Router,
    private titleService: Title
  ) {
    const initPageInfo = () => {
      setTimeout(() => { 
        const url = this.router.url;
        const isSkip = this.annonymousRoutes.some(route =>
          url.includes(route)
        );
        if(isSkip){
          return;
        }
        this.pageInfo.calculateTitle();
        this.pageInfo.calculateBreadcrumbs();
        // Set breadcrumbs according to the routes
        this.setBreadcrumbs(url);
        this.pageInfo.title.asObservable().subscribe((title) => {
          if(title?.hideTabTitle){
            return
          }
          const storedEnvironments = localStorage.getItem('AvailableEnvironments');
          const availableEnvironments = JSON.parse(storedEnvironments);
          const appName = availableEnvironments
            .filter(item => item.IsDefault === true)
            .map(item => item.AppName);

            var parser = new DOMParser();
            let text = parser.parseFromString(title.title,'text/html');
            let finalTitle = text.body.innerText;
            

          this.titleService.setTitle(`${appName} | ${finalTitle}`);
        });
      }, 0);
    };

    initPageInfo();

    // Subscribe to router events
    const sub = this.router.events
      .pipe(
        takeUntil(this._destroying$),
        filter((event) => event instanceof ResolveEnd))
      .subscribe(initPageInfo);
    this.unsubscribe.push(sub)
  }

  ngOnInit(): void {
    this.pluginsInitialization();
    const layoutUpdateSubscription = this.layout.layoutConfigSubject
      .asObservable()
      .subscribe(() => {
        this.pluginsReInitialization();
      });
    this.unsubscribe.push(layoutUpdateSubscription);
  }

  pluginsInitialization() {
    setTimeout(() => {
      ToggleComponent.bootstrap();
      ScrollTopComponent.bootstrap();
      DrawerComponent.bootstrap();
      StickyComponent.bootstrap();
      MenuComponent.bootstrap();
      ScrollComponent.bootstrap();
    }, 200);
  }

  pluginsReInitialization() {
    setTimeout(() => {
      ToggleComponent.reinitialization();
      ScrollTopComponent.reinitialization();
      DrawerComponent.reinitialization();
      StickyComponent.bootstrap();
      MenuComponent.reinitialization();
      ScrollComponent.reinitialization();
    }, 100);
  }

  setBreadcrumbs(url: any) {
    const sellIndirectRoutes = Object.values(SellIndirectRoutes);
    const sellDirectRoutes = Object.values(SellDirectRoutes);

    if (sellIndirectRoutes.includes(url)) {
      const parts = url.split('/').filter((crumb:any) => crumb !== '');
      const breadcrumbLabels = parts.map((part:string) => {
        switch (part) {
          case 'partner':
            return 'sell-indirect';
          case 'reseller-plans':
            return 'reseller-plans';
          case 'resellers':
            return 'resellers';
          default:
            return part;
        }
      });
      this.pageInfo.setBreadcrumbs(breadcrumbLabels);
    } else if (sellDirectRoutes.includes(url)) {
      const parts = url.split('/').filter((crumb:any) => crumb !== '');
      parts[0] = 'sell-direct';
      this.pageInfo.setBreadcrumbs(parts);
    } else {
      const parts = url.split('/').filter((crumb:any) => crumb !== '');

      // Filter out parts that look like UUIDs
      const filteredParts = parts.filter(part => !/^[0-9a-fA-F\-]{36}$/.test(part));
      this.pageInfo.setBreadcrumbs(filteredParts);
    }
  }

  ngOnDestroy() {
    this._destroying$.next();
    this._destroying$.complete();
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
