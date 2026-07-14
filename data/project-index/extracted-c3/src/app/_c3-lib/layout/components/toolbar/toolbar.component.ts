import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ILayout, LayoutType } from '../../core/configs/config';
import { LayoutService } from '../../core/layout.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];

  // Public props
  @Input() currentLayoutType: LayoutType | null;
  @Input() appToolbarLayout:
    | 'classic'
    | 'accounting'
    | 'extended'
    | 'reports'
    | 'saas';

  // toolbar
  appToolbarDisplay: boolean;
  appToolbarContainer: 'fixed' | 'fluid';
  appToolbarContainerCSSClass: string = '';
  appToolbarFixedDesktop: boolean;
  appToolbarFixedMobile: boolean;
  appPageTitleDisplay: boolean;

  // page title
  appPageTitleDirection: string = '';
  appPageTitleCSSClass: string = '';
  appPageTitleBreadcrumb: boolean;
  appPageTitleDescription: boolean;

  dynamicTemplate!: TemplateRef<any>|null;

  constructor(private layout: LayoutService, private cdRef: ChangeDetectorRef,
    private _dynamicTemplateService:DynamicTemplateService, private router: Router) {
      this.checkDynamicTemplate();
      //Below code is causing issue for dirty check
      // this.router.events.subscribe(event => {
      //   if (event instanceof NavigationStart) {
      //     this.dynamicTemplate = null;
      //   }
      //   if (event instanceof NavigationEnd) {
      //     this.checkDynamicTemplate();
      //   }
      // })

  }

  checkDynamicTemplate(){
    const subscr = this._dynamicTemplateService.template$.subscribe(res=>{
      this.dynamicTemplate = res;
      this.cdRef.detectChanges();
    });
    this.unsubscribe.push(subscr);
    // this._dynamicTemplateService.template$.subscribe(res=>{
    //   this.dynamicTemplate = res;
    //   this.cdRef.detectChanges();
    // });
  }

  ngOnInit(): void {
    const subscr = this.layout.layoutConfigSubject
      .asObservable()
      .subscribe((config: ILayout) => {
        this.updateProps(config);
      });
    this.unsubscribe.push(subscr);
  }

  updateProps(config: ILayout) {
    this.appToolbarDisplay = this.layout.getProp(
      'app.toolbar.display',
      config
    ) as boolean;
    if (!this.appToolbarDisplay) {
      return;
    }

    this.appPageTitleDisplay = this.layout.getProp(
      'app.pageTitle.display',
      config
    ) as boolean;
    this.appToolbarContainer = this.layout.getProp(
      'app.toolbar.container',
      config
    ) as 'fluid' | 'fixed';
    this.appToolbarContainerCSSClass =
      this.appToolbarContainer === 'fixed'
        ? 'container-xxl'
        : 'container-fluid';
    const containerClass = this.layout.getProp(
      'app.toolbar.containerClass',
      config
    ) as string;
    if (containerClass) {
      this.appToolbarContainerCSSClass += ` ${containerClass}`;
    }

    this.appToolbarFixedDesktop = this.layout.getProp(
      'app.toolbar.fixed.desktop',
      config
    ) as boolean;
    if (this.appToolbarFixedDesktop) {
      document.body.setAttribute('data-kt-app-toolbar-fixed', 'true');
    }

    this.appToolbarFixedMobile = this.layout.getProp(
      'app.toolbar.fixed.mobile',
      config
    ) as boolean;
    if (this.appToolbarFixedMobile) {
      document.body.setAttribute('data-kt-app-toolbar-fixed-mobile', 'true');
    }

    // toolbar
    this.appPageTitleDirection = this.layout.getProp(
      'app.pageTitle.direction',
      config
    ) as string;
    this.appPageTitleCSSClass = this.layout.getProp(
      'app.pageTitle.class',
      config
    ) as string;
    this.appPageTitleBreadcrumb = this.layout.getProp(
      'app.pageTitle.breadCrumb',
      config
    ) as boolean;
    this.appPageTitleDescription = this.layout.getProp(
      'app.pageTitle.description',
      config
    ) as boolean;

    document.body.setAttribute('data-kt-app-toolbar-enabled', 'true');
    document.body.setAttribute('data-kt-app-header-minimize', 'on');
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
