import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CustomDashboardCardsService } from 'src/app/modules/administration/services/custom-dashboard-cards.service';
import { TranslationModule } from 'src/app/modules/i18n';
import { CommonService } from 'src/app/services/common.service';
import { CommonNoRecordComponent } from "../../common-no-record/common-no-record.component";
import { LimitLengthPipe } from "../../../../shared/pipes/limitLength.pipe";
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { PermissionService } from 'src/app/services/permission.service';

@Component({
  selector: 'app-custom-cards-dashboard',
  standalone: true,
  imports: [TranslationModule, NgStyle, CommonNoRecordComponent, CommonModule, LimitLengthPipe, NgbTooltip],
  templateUrl: './custom-cards-dashboard.component.html',
  styleUrl: './custom-cards-dashboard.component.scss'
})
export class CustomCardsDashboardComponent implements OnInit {
  _subscription: Subscription;
  destroy$ = new Subject<void>();
  data: any[] = [];
  isCustomCardDetailsLoading: boolean = true;
  entityName: string;
  recordId: any;
  bgColor: any;
  isLoading: boolean = false;
  constructor(private _customDashboardCardsService: CustomDashboardCardsService,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
  ) {
    this.HasPermissions();
   }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    if(this.permissions.HasGetCustomCardsList == 'Allowed') {
        this.getCustomCardDetails();
     }
  }
  permissions =
  {
    HasGetCustomCardsList: "Denied",

  };

HasPermissions() {
  this.permissions.HasGetCustomCardsList = this._permissionService.hasPermission('GET_CUSTOM_CARDS_LIST');

}



  getCustomCardDetails() {
    const searchParams = {
      EntityName: this.entityName,
      RecordId: this.recordId,
      PageCount: 1000,
      PageIndex: 0,
      ParentEntity: this.entityName == 'Partner' ? 'PartnerDashboard' : 'ResellerDashboard',
      IsCustomCardAssignmentPage: this.recordId != null ? true : false
    };

    if (this.entityName == 'Partner') {
      searchParams.ParentEntity = 'PartnerDashboard'
    }
    else if (this.entityName == 'Reseller') {
      searchParams.ParentEntity = 'ResellerDashboard'
    }
    else {
      searchParams.ParentEntity = this.entityName;
    }

    this._subscription = this._customDashboardCardsService.getCustomCards(searchParams).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.data = response.Data;
      this.isLoading = true;
      if (this.data.length > 0) {
        this.data = this.data.sort((a, b) => a.Sequence - b.Sequence);
      }
    });
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe()
    this.destroy$.next();
    this.destroy$.complete();
  }
}
