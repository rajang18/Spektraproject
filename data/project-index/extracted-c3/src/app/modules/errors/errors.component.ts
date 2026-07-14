import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DrawerComponent, MenuComponent, ScrollComponent, ScrollTopComponent, StickyComponent, ToggleComponent } from 'src/app/_c3-lib/kt/components';
import { AppReadyService } from 'src/app/services/app-ready.service';
import { LoaderService } from 'src/app/services/loader.service';
import { waitForUIReady } from 'src/app/services/ui-ready.util';

const BODY_CLASSES = ['bgi-size-cover', 'bgi-position-center', 'bgi-no-repeat'];

@Component({
  selector: 'app-errors',
  templateUrl: './errors.component.html',
  styleUrls: ['./errors.component.scss'],
})
export class ErrorsComponent implements OnInit, OnDestroy {
  @HostBinding('class') class = 'd-flex flex-column flex-root';
  constructor(private router: Router, private appReadyService: AppReadyService, private loader: LoaderService) {}

  ngOnInit(): void {
    console.log("LayoutComponent ngAfterViewInit started.");
    waitForUIReady().then(()=>{
        console.log("LayoutComponent ngAfterViewInit started2.");
        this.appReadyService.markReady(); // removes splash + shows app
        this.loader.isLayoutLoaded = true;
    });
    BODY_CLASSES.forEach((c) => document.body.classList.add(c));
  }

  ngOnDestroy(): void {
    BODY_CLASSES.forEach((c) => document.body.classList.remove(c));
  }

  routeToDashboard() {
    this.router.navigate(['dashboard']);
    setTimeout(() => {
      ToggleComponent.bootstrap();
      ScrollTopComponent.bootstrap();
      DrawerComponent.bootstrap();
      StickyComponent.bootstrap();
      MenuComponent.bootstrap();
      ScrollComponent.bootstrap();
    }, 200);
  }
}
