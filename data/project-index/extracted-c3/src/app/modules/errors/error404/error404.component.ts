import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DrawerComponent, MenuComponent, ScrollComponent, ScrollTopComponent, StickyComponent, ToggleComponent } from 'src/app/_c3-lib/kt/components';

import { ThemeModeService } from 'src/app/_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';

@Component({
  selector: 'app-error404',
  templateUrl: './error404.component.html',
  styleUrls: ['./error404.component.scss'],
})
export class Error404Component implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];

  constructor(private router: Router, private modeService: ThemeModeService) {}

  ngOnInit(): void {
    const subscr = this.modeService.mode.asObservable().subscribe((mode:any) => {
      document.body.style.backgroundImage =
        mode === 'dark'
          ? 'url(./assets/media/auth/bg1-dark.jpg)'
          : 'url(./assets/media/auth/bg1.jpg)';
    });
    this.unsubscribe.push(subscr);
  }

  routeToDashboard() {
    let url= window.location.protocol+"//"+window.location.host;
    setTimeout(() => {
      ToggleComponent.reinitialization();
      ScrollTopComponent.reinitialization();
      DrawerComponent.reinitialization();
      StickyComponent.bootstrap();
      MenuComponent.reinitialization();
      ScrollComponent.reinitialization();
    }, 200);
    var anchor= document.createElement('a');
    anchor.href = url;
    anchor.click();
    anchor.remove();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
    document.body.style.backgroundImage = 'none';
  }
}
