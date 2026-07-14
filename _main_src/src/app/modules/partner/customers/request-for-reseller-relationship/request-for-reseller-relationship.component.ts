import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { RequestForResellerRelationshipService } from '../services/request-for-reseller-relationship.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';


@Component({
  selector: 'app-request-for-reseller-relationship',
  templateUrl: './request-for-reseller-relationship.component.html',
  styleUrl: './request-for-reseller-relationship.component.scss'
})
export class RequestForResellerRelationshipComponent extends C3BaseComponent implements OnInit, OnDestroy {


  ResellerRelationshipDetails:any = null;
  EncodedRelationshipRequestMessage:any = '';
  CanConsiderDAP:boolean = true;
  resellerRelationshipRequestMessage:any = '';


  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  emailSubject: any;
  EntityName: string;
  constructor(
    private toastService: ToastService,
    private translateService: TranslateService,
    private commonService: CommonService,
    private requestRelationshipService: RequestForResellerRelationshipService,
    private _cdRef: ChangeDetectorRef,
    private notifier: NotifierService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _pageInfo:PageInfoService,
    private _appService: AppSettingsService, 

  ) { 
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.emailSubject =this.translateService.instant('TRANSLATE.REQUEST_A_RESELLER_RELATIONSHIP_SUBJECT_RESELLER_RELATIONSHIP_REQUEST')
  }
  ngOnInit(): void {
    this.GetResellerRelationshipDetails();
    this.EntityName = this.commonService.entityName;
    this._pageInfo.updateTitle(this.translateService.instant("TRANSLATE.CAPTION_REQUEST_FOR_RESELLER_RELATIONSHIP"),true);
    if(this.commonService.entityName === 'Reseller'){
      this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE','CAPTION_REQUEST_FOR_RESELLER_RELATIONSHIP']);
    }
    else if(this.commonService.entityName === 'Partner'){
      this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE','CAPTION_REQUEST_FOR_RESELLER_RELATIONSHIP']);
    }

  }

   BuildMessage() {
    /*
        Regex for replacing <br/> tag with new line 
    */
    let regex = /<br\s*[\/]?>/gi;
    //console.log(this.resellerRelationshipRequestMessage);
    if (this.ResellerRelationshipDetails != undefined && this.ResellerRelationshipDetails != null && this.ResellerRelationshipDetails != '') {
        if (this.ResellerRelationshipDetails.HasSupportsResellersWithBusinessId == 'Yes' && this.ResellerRelationshipDetails.ProviderBusinessId != null && this.ResellerRelationshipDetails.ProviderBusinessId != '') {
            let htmlText:any = this.translateService.instant("TRANSLATE.MICROSOFT_RESELLER_RELATIONSHIP_REQUEST_TEXT_FOR_PROVIDER_RESELLER_CUSTOMERS", {
                 partnerCompanyName: this.ResellerRelationshipDetails.PartnerCompanyName,
                partnerTenantId: this.ResellerRelationshipDetails.PartnerTenantId,
                partnerContactEmail: this.ResellerRelationshipDetails.PartnerContactEmail,
                partnerContactNumber: this.ResellerRelationshipDetails.PartnerContactPhoneNumber,
                resellerName: this.ResellerRelationshipDetails.ResellerName,
                providerResellerId: this.ResellerRelationshipDetails.ProviderResellerId,
                providerBusinessId: this.ResellerRelationshipDetails.ProviderBusinessId
            });
            this.resellerRelationshipRequestMessage = $($("<div />").html(htmlText.replace(regex, "\n"))).text();
            this.EncodedRelationshipRequestMessage = encodeURIComponent(this.resellerRelationshipRequestMessage);
        }
        else {
          let htmlText:any = this.translateService.instant("TRANSLATE.MICROSOFT_RESELLER_RELATIONSHIP_REQUEST_TEXT_FOR_PARTNER_CUSTOMERS", {
                loggedInUserName: this.ResellerRelationshipDetails.LoggedInUserName,
                applicationName: this.ResellerRelationshipDetails.PartnerCompanyName,
                partnerTenantId: this.ResellerRelationshipDetails.PartnerTenantId,
                contactEmail: this.ResellerRelationshipDetails.PartnerContactEmail,
                contactNumber: this.ResellerRelationshipDetails.PartnerContactPhoneNumber
            });
            this.resellerRelationshipRequestMessage = $($("<div />").html(htmlText.replace(regex, "\n"))).text();
            this.EncodedRelationshipRequestMessage = encodeURIComponent(this.resellerRelationshipRequestMessage);
        }
    }
}


GetResellerRelationshipDetails(){
  let providerName="Microsoft";
  this._subscription = this.requestRelationshipService.GetResellerRelationshipDetails(providerName,this.commonService.entityName,this.commonService.recordId).pipe(takeUntil(this.destroy$)).subscribe((data:any) => {
    this.ResellerRelationshipDetails = data;
    this.BuildMessage();
    this._cdRef.detectChanges();
   },
   (error : any) =>{
      let message = error.ErrorDetail != null ? 'TRANSLATE.'+error.ErrorDetail : 'TRANSLATE.GETTING_RELLER_RELATIONSHIP_REQUEST_ERROR_DESC';
      message = this.translateService.instant(message);
      this.toastService.error(message);
   }
  );
}

 ConfirmCopy() {
  this.notifier.success({title:this.translateService.instant("TRANSLATE.ALERT_MESSAGE_COPIED_TO_CLIPBOARD")})
}

OnRelationshipRequestMessageChange() {
  //Encoding the body message
  this.EncodedRelationshipRequestMessage = encodeURIComponent(this.resellerRelationshipRequestMessage);
}

  ReloadTableData() {
    this.reloadEvent.emit(true);
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }
  
  ngOnDestroy(): void { 
    super.ngOnDestroy();
  }

}
