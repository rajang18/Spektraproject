import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, interval, switchMap,takeUntil } from 'rxjs';
import { PageInfoService} from 'src/app/_c3-lib/layout'; 
import { NotifierService } from 'src/app/services/notifier.service';
import { SearchModel } from 'src/app/shared/models/common';
import { PlansListingService } from '../../services/plans-listing.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-plan-update-progress',
  templateUrl: './plan-update-progress.component.html',
  styleUrl: './plan-update-progress.component.scss'
})
export class PlanUpdateProgressComponent extends C3BaseComponent implements OnInit , OnDestroy {

  reloadPlans: any[] = [];
  isAlertEnabled: boolean;
  statusLoading: boolean;
  pageMode: string;
  isAnyActivePlanLeft: boolean = true;
  private timerHandleForAllPlans: Subscription | null = null;

  constructor(private _palnService: PlansListingService,
    private _cdref: ChangeDetectorRef,
    private translateService: TranslateService,
    
    private pageInfo: PageInfoService,
    _pageService: PageInfoService,
    private _notifierService: NotifierService,
    public router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, router, _appService);
    const navigation = this.router.getCurrentNavigation();
    this.pageMode = navigation?.extras.state?.['pageMode'] ? navigation?.extras.state?.['pageMode'] : 'add';
  }

  ngOnInit() { 
    this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'MENUS_PARTNER_PLANS', 'ADD_MISSING_OFFERS_STATUS'])
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.ADD_MISSING_OFFERS_STATUS"),true);
    const tittle = this.translateService.instant('TRANSLATE.PLAN_IS_IN_PROGRESS_EXCEPTION');
    this._notifierService.alert({title:tittle});
    if (this.pageMode === 'Status' || this.pageMode === null) {
      this.getAddMissingOffersPlansStatus();
    }
    else {
      this.addMissingOffersToPlansWebJOB();
    }
  }
 

  addMissingOffersToPlansWebJOB() {
    let planSearchModel: SearchModel = new SearchModel()
    const subscription  = this._palnService.addMissingOffersToPlansWebJOB(planSearchModel).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
      if (res.Status === "Success") {
        if (res.Data !== 'NO_PLAN_AVAILABLE') {
          //notifier.notify($filter('translate')(response.data.Data));
          this.isAlertEnabled = false;
          this.getAddMissingOffersPlansStatus();
        }
        else {
          this.isAlertEnabled = true;
        }
      }
      else {
        this.statusLoading = false;
        //notifier.notifyError($filter('translate')('ADD_MISSING_OFFERS_INITIAT_FAIL'));
        this.stopPollingForPlans();
      }
      this._cdref.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }


  getAddMissingOffersPlansStatus() {
    this.statusLoading = true;
    const subscription = this._palnService.getAddMissingOffersPlansStatus()
      .pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        if (res.Status === "Success") {
          let webojobstatusresponse = res.Data;
          this.reloadPlans = webojobstatusresponse.C3Plans;
          this.reloadPlans.forEach(v => {
            if (v.Status == 'Queued' || v.Status == 'InProgress') {
              this.statusLoading = true;
            }
          })
          if (this.statusLoading) {
            this.pollForStatusOfPlans();
          }
          else {
            this.stopPollingForPlans();
          }
        }
        else {
          this.statusLoading = false;
          this.stopPollingForPlans();
        }

        this.isCompleteButtonEnabled();
        this._cdref.detectChanges();
      })
      this._subscriptionArray.push(subscription);

  }

  backToPlans() {
    this.router.navigate([`partner/plans`]);
  }

  completeJobStatus() {
    let plans: any[] = [];
    this.reloadPlans.forEach((obj) => {
      plans.push({ Id: obj.PlanId, InternalPlanId: obj.InternalPlanId, JobLogC3Id: obj.JobLogC3Id });
    });

    var jobStatusForMissingOffersModel = { Plans: plans };
    const subscription = this._palnService.completeWebJobStatus(jobStatusForMissingOffersModel).pipe(takeUntil(this.destroy$)).subscribe((response) => {
      this.router.navigate([`partner/plans`]);
    });
    this._subscriptionArray.push(subscription);
  }

  isCompleteButtonEnabled() {
    this.isAnyActivePlanLeft = false;
    this.reloadPlans.forEach((obj) => {
      if (obj.Status == 'Queued' || obj.Status == 'InProgress') {
        this.isAnyActivePlanLeft = true;
      }
    });
  }

  pollForStatusOfPlans() {
    this.stopPollingForPlans();
    if (this.statusLoading && !this.timerHandleForAllPlans) {
      this.timerHandleForAllPlans = interval(30000).pipe(
        switchMap(() => {
          this.getAddMissingOffersPlansStatus();
          this.isCompleteButtonEnabled();
          return [];
        })
      ).subscribe();
    } else {
      this.statusLoading = false;
    }
  }

  stopPollingForPlans() {
    if (this.timerHandleForAllPlans) {
      this.timerHandleForAllPlans.unsubscribe();
      this.timerHandleForAllPlans = null;
    }
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.stopPollingForPlans();

  }

}
