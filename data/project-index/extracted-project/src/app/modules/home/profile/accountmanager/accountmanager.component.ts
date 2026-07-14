import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { CommonService } from 'src/app/services/common.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { AccountManagerService } from '../services/accountmanager.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-accountmanager',
  templateUrl: './accountmanager.component.html',
  styleUrl: './accountmanager.component.scss'
})
export class AccountmanagerComponent extends C3BaseComponent implements OnInit, OnDestroy {
  providerName: string;
  accountManagerDetails:any;
  ServiceProviderCustomers:any[];
  accountManagerName: string;

  entityName: string | null;
  recordId: string | null;
  isLoading:boolean = false;
  @ViewChild('specialQualificationsModal') specialQualificationsModal: TemplateRef<any>;


  constructor(private _translateService: TranslateService,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
    public _router: Router,
    public _route: ActivatedRoute,
    public _dynamicTemplateService: DynamicTemplateService,
    public _AccountManagerService: AccountManagerService,
    private pageInfo: PageInfoService,
    private _appService: AppSettingsService,  


  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this._subscription = _route.params.subscribe((params: any) => {
      this.providerName = params['providerName']
    })

  }
  permissions: any = {
    HasGetAccountManagerDetails: "Denied"

  };

  HasPermission() {
    this.permissions.HasGetAccountManagerDetails = this._permissionService.hasPermission(CloudHubConstants.GETACCOUNTMANAGERDETAILSOFCUSTOMER);
  }
  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.GetAccountManagerDetails();
    this.HasPermission();
    this.pageInfo.updateTitle(this._translateService.instant("SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE"),true);
    this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENU_CUSTOMER_PROFILE']);
  }

  GetAccountManagerDetails() {
    this.isLoading = true;
    this._subscription = this._AccountManagerService.GetAccountManagerDetails().subscribe((response: any) => {
      this.accountManagerDetails = response;
      this.isLoading = false;
      if (this.accountManagerDetails !== null && this.accountManagerDetails !== undefined && this.accountManagerDetails !== '') {
        if (this.accountManagerDetails.FirstName !== null && this.accountManagerDetails.FirstName !== undefined && this.accountManagerDetails.FirstName !== '') {
          this.accountManagerName = this.accountManagerDetails.FirstName;
        }
        if (this.accountManagerDetails.LastName !== null && this.accountManagerDetails.LastName !== undefined && this.accountManagerDetails.LastName !== '') {
          this.accountManagerName = this.accountManagerName + " " + this.accountManagerDetails.LastName;
        }
      }
    });
  }




  ngOnDestroy(): void {

  }

}
