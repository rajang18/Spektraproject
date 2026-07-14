import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
 
export interface PageLink {
  title: string;
  path: string;
  isActive: boolean;
  isSeparator?: boolean;
  removeLocalization:boolean;
  useInnerHTML:boolean
}
 
export class PageInfo {
  breadcrumbs: string[] = [];
  title: string = '';
}
 
@Injectable({
  providedIn: 'root',
})
export class PageInfoService {
  public title: BehaviorSubject<{title:string,removeLocalization:boolean,hideTabTitle?:boolean }> = new BehaviorSubject<{title:string,removeLocalization:boolean}>(
    {title:'Dashboard',removeLocalization:false}
  );
  public description: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public breadcrumbs: BehaviorSubject<Array<PageLink>> = new BehaviorSubject<
    Array<PageLink>
  >([]);
 
  constructor() {}
 
  public setTitle(_title: string,removeLocalization:boolean = false,hideTabTitle:boolean = false) {
    this.title.next({title:_title,removeLocalization:removeLocalization,hideTabTitle:hideTabTitle});
  }
 
  public updateTitle(_title: string,removeLocalization:boolean = false, hideTabTitle:boolean = false) {
    setTimeout(() => {
      this.setTitle(_title,removeLocalization, hideTabTitle);
    }, 0);
  }
 
  public setDescription(_title: string) {
    this.description.next(_title);
  }
 
  public updateDescription(_description: string) {
    setTimeout(() => {
      this.setDescription(_description);
    }, 0);
  }
 
  public setBreadcrumbs(_bs: any) {
    this.breadcrumbs?.next(_bs);
  }
 
  public updateBreadcrumbs(_bs:any) {
    setTimeout(() => {
      this.setBreadcrumbs(_bs);
    }, 20);
  }
 
  public calculateTitle() {
    const asideTitle = this.calculateTitleInMenu('kt_app_sidebar');
    const headerTitle = this.calculateTitleInMenu('kt_app_header_wrapper');
    const title = asideTitle || headerTitle || '';
    let text = title.replace(/^./, match => match.toUpperCase());
    this.setTitle(text,true);
  }
 
  public calculateTitleInMenu(menuId: string): string | undefined {
    const menu = document.getElementById(menuId);
    if (!menu) {
      return;
    }
 
    const allActiveMenuLinks = Array.from<HTMLLinkElement>(
      menu.querySelectorAll('a.menu-link')
    ).filter((link) => link.classList.contains('active'));
 
    if (!allActiveMenuLinks || allActiveMenuLinks.length === 0) {
      return;
    }
 
    const titleSpan = allActiveMenuLinks[0].querySelector(
      'span.menu-title'
    ) as HTMLSpanElement | null;
    if (!titleSpan) {
      return;
    }
 
    return titleSpan.innerText;
  }
 
  public calculateBreadcrumbs() {
    const asideBc = this.calculateBreadcrumbsInMenu('kt_app_sidebar');
    const headerBc = this.calculateBreadcrumbsInMenu('kt_app_header_wrapper');
    const bc = asideBc && asideBc.length > 0 ? asideBc : headerBc;
 
    if (!bc) {
      this.setBreadcrumbs([]);
      return;
    }
    this.setBreadcrumbs(bc);
  }
 
  public calculateBreadcrumbsInMenu(
    menuId: string
  ): Array<PageLink> | undefined {
    const result: Array<PageLink> = [];
    const menu = document.getElementById(menuId);
    if (!menu) {
      return;
    }
 
    const allActiveParents = Array.from<HTMLDivElement>(
      menu.querySelectorAll('div.menu-item')
    ).filter((link) => link.classList.contains('here'));
 
    if (!allActiveParents || allActiveParents.length === 0) {
      return;
    }
 
    allActiveParents.forEach((parent) => {
      const titleSpan = parent.querySelector(
        'span.menu-title'
      ) as HTMLSpanElement | null;
      if (!titleSpan) {
        return;
      }
 
      const title = titleSpan.innerText;
      const path = titleSpan.getAttribute('data-link');
      if (!path) {
        return;
      }
 
      result.push({
        title,
        path,
        isSeparator: false,
        isActive: false,
        removeLocalization:false,
        useInnerHTML:false
      });
      // add separator
      result.push({
        title: '',
        path: '',
        isSeparator: true,
        isActive: false,
        removeLocalization:false,
        useInnerHTML:false
      });
    });
 
    return result;
  }
}