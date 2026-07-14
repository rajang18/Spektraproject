import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { IReportEmbedConfiguration, models} from 'powerbi-client';
import { AzureUsagePowerbiServiceService } from 'src/app/services/azure-usage-powerbi-service.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-customer-azure-usage-powerbi',
  templateUrl: './customer-azure-usage-powerbi.component.html',
  styleUrl: './customer-azure-usage-powerbi.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class CustomerAzureUsagePowerbiComponent extends  C3BaseComponent implements OnInit, OnDestroy{
  ReportMode:string = "List";
  CurrentReport:any = {};
  ShowPowerBi:any = false;
  
  // API call to get PowerBI Report

  // var staticReportUrl = serviceBase + "api/powerbireport/partner";
  
  staticReportUrl = "https://powerbiembedapi.azurewebsites.net/api/reports/c52af8ab-0468-4165-92af-dc39858d66ad";

  _filterPaneEnabled = false;
  _navContentPaneEnabled = true;
  _reportHandle = null;

  reportConfig: IReportEmbedConfiguration = {

    accessToken : null,
    embedUrl :null,
    id : null,
    pageName : null,
    type : null,
    tokenType : null,
    permissions : null,
    settings :{
     
    },
  };


  constructor( 
    private _translateService: TranslateService,
    public pageInfo: PageInfoService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _commmonService:CommonService,
    private azureUsagePowerbiServiceService:AzureUsagePowerbiServiceService,
    private _appService: AppSettingsService, ){

      super(_permissionService, _dynamicTemplateService, _router, _appService);

  }

  ngOnInit(): void {
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.BREADCRUM_BUTTON_TEXT_POWER_BI_REPORTS"),true);
    
    if(this._commmonService.entityName.toLowerCase() === 'partner' || this._commmonService.entityName.toLowerCase() === 'reseller'){
      this.pageInfo.updateBreadcrumbs(['MENU_BREADCRUM_BUTTON_TEXT_MICROSOFT'])
    }
    else{
      this.pageInfo.updateBreadcrumbs(['BREADCRUM_BUTTON_TEXT_POWER_BI_REPORTS']);
    }

    
    const subscription = this.azureUsagePowerbiServiceService.GetReports(this.staticReportUrl).pipe(takeUntil(this.destroy$)).subscribe((data:any)=>{
      
      let parsedData = JSON.parse(data);

      this.reportConfig.accessToken = parsedData.accessToken;
      this.reportConfig.embedUrl = parsedData.embedUrl;
      this.reportConfig.id = parsedData.id;
      this.reportConfig.pageName = parsedData.name;
      this.reportConfig.type = parsedData.type;
      this.reportConfig.tokenType = models.TokenType.Embed,
      this.reportConfig.permissions = models.Permissions.All,
      this.reportConfig.settings ={
        filterPaneEnabled: this._filterPaneEnabled,
        navContentPaneEnabled: this._navContentPaneEnabled
      }

      this.ShowPowerBi =true


    })
    this._subscriptionArray.push(subscription);







  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
  
  backnavigation() {
    this.ReportMode = "List";
  };

}
