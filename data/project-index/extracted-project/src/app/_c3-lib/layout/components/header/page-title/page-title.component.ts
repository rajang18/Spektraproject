import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { PageInfoService, PageLink } from '../../../core/page-info.service';
import { C3TranslatePipe } from 'src/app/shared/pipes/c3-translate.pipe';

@Component({
  selector: 'app-page-title',
  templateUrl: './page-title.component.html',
})
export class PageTitleComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];

  @Input() appPageTitleDirection: string = '';
  @Input() appPageTitleBreadcrumb: boolean;
  @Input() appPageTitleDescription: boolean;

  title$: Observable<string>;
  description$: Observable<string>;
  title: {title:string,removeLocalization:boolean,hideTabTitle?:boolean};
  breadcrumbs: any[];

  constructor(
    private pageInfo: PageInfoService,
    private _cdref: ChangeDetectorRef,
    private c3Translate:C3TranslatePipe,
  ) { }

  ngOnInit(): void { 
    this.pageInfo.title.subscribe(res=>{
      this.title = res;
      this._cdref.detectChanges();
    })
    this.description$ = this.pageInfo.description.asObservable();
    this.pageInfo.breadcrumbs.subscribe((data: any) => { 
      if(data[data.length - 1]!="" && this.title == null){
        this.title.title = data[data.length - 1];
      }
      this.breadcrumbs = data.includes('home') ? '': data;
      //this.breadcrumbs = this.breadcrumbs?.filter( elm => !!elm);
      this._cdref.detectChanges();
      if(this.breadcrumbs.length>0){
        this.breadcrumbs.forEach(v=>{
          if(v.useInnerHTML){
            v.value = this.c3Translate.transform(v.value);
          }
        })
      }
    });

  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
