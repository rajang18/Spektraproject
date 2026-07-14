import { ChangeDetectorRef, Component, OnDestroy, OnInit, AfterViewChecked } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription, forkJoin } from 'rxjs';
import { SideMenuData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { MenuService } from 'src/app/services/menu.service';
import { MenuComponent } from 'src/app/_c3-lib/kt/components/MenuComponent';

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrls: ['./sidebar-menu.component.scss']
})
export class SidebarMenuComponent implements OnInit, OnDestroy, AfterViewChecked {
  subscription: Subscription;
  sideMenuData!: Array<SideMenuData>;
  showSideMenu = true;
  private menuInitialized = false;

  constructor(
    private menuService: MenuService,
    private sanitizer: DomSanitizer,
    private cdref: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.menuService.$isPublicAccess.subscribe(res => {
      this.showSideMenu = !res;
      this.menuInitialized = false;
      this.cdref.detectChanges();
    })
    this.subscription = forkJoin({
      sideMenuData: this.menuService.GetMenuItems(),
    }).subscribe({
      next: (result: { sideMenuData: any }) => {
        this.sideMenuData = result.sideMenuData.filter((e: any) => e.parent.IsSideMenu);
        this.menuInitialized = false;
      },
    })
  }

  ngAfterViewChecked(): void {
    if (!this.showSideMenu || this.menuInitialized) {
      return;
    }
    const menuEl = document.querySelector('#kt_app_sidebar_menu[data-kt-menu="true"]');
    if (menuEl && this.sideMenuData?.length) {
      this.menuInitialized = true;
      setTimeout(() => MenuComponent.reinitialization(), 0);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  setSVGForSideMenu(){
    // this.sideMenuData.forEach(v=>{
    //   let parentsvg= "../../../../../../assets/svg-icons/" + v.parent.Menu + '.svg';
    //   this.menuService.getSvgIcon(parentsvg)
    //   .subscribe(html=>{
    //     v.parent.svg = this.sanitizer.bypassSecurityTrustHtml(html);
    //     this.cdref.detectChanges();
    //   })

    //   v.children.forEach(p=>{
    //     let childsvg = "../../../../../../assets/svg-icons/" + p.Menu + '.svg';
    //     this.menuService.getSvgIcon(childsvg)
    //     .subscribe(html=>{
    //       p.svg = this.sanitizer.bypassSecurityTrustHtml(html);
    //       this.cdref.detectChanges();
    //     })
    //   })
      
    // })
    
  }
}
