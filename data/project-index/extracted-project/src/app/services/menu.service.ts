import { Injectable } from '@angular/core';
import { MenuItems } from '../shared/models/appsettings.model';
import { Observable, of, Subject, tap } from 'rxjs';
import { SideMenuData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { HttpClient } from '@angular/common/http';
import _ from 'lodash' 
import { AuthService } from '../shared/models/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(private http:HttpClient,private _authService: AuthService,) { }
  private cachedSideMenuItems: Observable<SideMenuData[]> | null = null; 
  private _isPublicAccess:Subject<boolean> =new Subject();
  public $isPublicAccess:Observable<boolean> = this._isPublicAccess.asObservable();
  private navMenuData:any[];

  public get isMenuSet(){
    if(this.cachedSideMenuItems){
        return true;
    }
    return false;
  }

  setIsPublicAccess(val=false){
    this._isPublicAccess.next(val)
  }
  
  GetMenuItems():Observable<SideMenuData[]>{
    return this.cachedSideMenuItems
    ? this.cachedSideMenuItems
    : of([]).pipe(
        tap((items) => {
          if (items.length === 0) {
            localStorage.clear();
            this._authService.logoutRedirect()
          }
        })
      );
  }

  getNavBarMenuData(){
    return of(this.navMenuData.filter(data => data.IsSideMenu === false && data.ParentMenu == null));
  }

  SetMenuItems(menuItems:MenuItems[]){
    this.navMenuData = menuItems;
    this._ArrangeMenuItems(menuItems,null);
    this.cachedSideMenuItems = of(this._TransformToSideMenuData(menuItems));
  }
 
  private _setHref(allMenus: MenuItems[], parentMenuId: any){
    allMenus.forEach(v=>{
      v.Sref = v.Sref.trim();
      v.Sref = v.Sref.replace(".","/");
      let subMenu = allMenus.filter(v=> v.ParentMenu == parentMenuId)
      this._setHref(subMenu, v.Id)
    }) 
  }

  private _TransformToSideMenuData(allMenus: MenuItems[]):SideMenuData[]{ 
    this._setHref(allMenus,null);
    let sideMenuData = allMenus.filter(data => data.IsSideMenu === true);
    const topLevelItems = allMenus.filter(item => !item.ParentMenu);
    let sideMenu:SideMenuData[] = []
    topLevelItems.forEach(item => {
      const subMenuItems = sideMenuData.filter(child => child.ParentMenu === item.Id);
        const subMenuItem: any = {
          parent: item,
          children: subMenuItems? subMenuItems:undefined
        };
        sideMenu.push(subMenuItem);
    });
    return sideMenu;
  } 

  private _ArrangeMenuItems(allMenus: MenuItems[], parentMenuId: any): any{ 

    return _.chain(allMenus).map(eachMenu => {
      if (eachMenu.ParentMenu === parentMenuId) {
          return {
              id: eachMenu.Menu,
              heading: eachMenu.Heading ? true : false,
              icon: eachMenu.Icon,
              issidemenu: eachMenu.IsSideMenu ? true : false,
              sref: eachMenu.Sref,
              submenu: this._ArrangeMenuItems(allMenus, eachMenu.Id),//#change after adding submenus
              target: null, //#change after adding target
              text: eachMenu.Text,
              orderSequence: eachMenu.OrderSequence
          };
      }
  }).compact().sortBy('orderSequence').value();
    // const filteredMenus = allMenus
    //     .filter(eachMenu => eachMenu.ParentMenu === parentMenuId)
    //     .map(eachMenu => ({
    //       ...eachMenu,
    //       submenu: this._ArrangeMenuItems(allMenus, eachMenu.Id) // recursively arrange submenus
    //     }));
    //   return filteredMenus.sort((a, b) => (a.OrderSequence || 0) - (b.OrderSequence || 0));
  }

  getSvgIcon(path: string): Observable<string> {
    //return this.http.get(path, { responseType: 'text' });
    return null;
  }

}
