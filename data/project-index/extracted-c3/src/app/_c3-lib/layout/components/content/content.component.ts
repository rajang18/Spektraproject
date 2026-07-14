import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { LoaderService } from 'src/app/services/loader.service';
// import { DrawerComponent } from '../../../kt/components';
@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit, OnDestroy {
  @Input() contentContainerCSSClass: string = '';
  @Input() appContentContiner?: 'fixed' | 'fluid';
  @Input() appContentContainerClass: string = '';
  isLoading:boolean;
  destroy$ = new Subject<void>();
  private unsubscribe: Subscription[] = [];

  constructor(
    private router: Router,
    private _loaderService:LoaderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this._loaderService.isCommonLoading().subscribe(res=>{
      this.isLoading = res;
      this.cdr.detectChanges();
    })
    this.cdr.detectChanges()
    this.routingChanges();
  }

  routingChanges() {
    const routerSubscription = this.router.events
    .pipe(takeUntil(this.destroy$))
    .subscribe((event) => { 
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        // DrawerComponent.hideAll();
      }
    });
    this.unsubscribe.push(routerSubscription);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
