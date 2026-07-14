import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { CommonService } from 'src/app/services/common.service';
import { CustomerOnboardService } from 'src/app/services/customer-onboard.service';
import { DataSharingModel, EVENT_TYPE } from 'src/app/shared/models/common';
import { MODAL_DIALOG_CLASS } from 'src/app/shared/models/report-popup.model';

@Component({
  selector: 'app-onboard-microsoft-customer-non-shared',
  templateUrl: './onboard-microsoft-customer-non-shared.component.html',
  styleUrl: './onboard-microsoft-customer-non-shared.component.scss'
})
export class OnboardMicrosoftCustomerNonSharedComponent implements OnInit {

stateData:any;
  onboardCustomerModel: any;
  customerC3Id: any;
  loadingSubscriptions: any;
  subscriptionsList: any;
  pageVisibleList: any;
  entityName:string | null;
  recordId:string | null;
  productspromotionsdetails: any;
  customerName: string | null = null;
  _subscriptionArray: Subscription[] = [];
  destroy$ = new Subject<void>();
  constructor(
    private _activatedRoute:ActivatedRoute, 
    private _router:Router, 
    private _commonService: CommonService, 
    private _onboardService: CustomerOnboardService,
    private _translateService: TranslateService,
    private _modalService: NgbModal,
    private _cdRef: ChangeDetectorRef,
    public _pageInfo:PageInfoService

  ){
    this.stateData = _router.getCurrentNavigation()?.extras.state?.stateData
    this.entityName = _commonService.entityName;
    this.recordId = _commonService.recordId;
    if(this.stateData != undefined){
      this.onboardCustomerModel = this.stateData?.onboardCustomerModel;
      this.customerC3Id = this.stateData.customerC3Id;
      this.loadingSubscriptions = this.stateData.loadingSubscriptions;
      this.subscriptionsList = this.stateData.subscriptionsList;
      this.pageVisibleList = this.stateData.pageVisibleList;
      this.subscriptionsList.forEach((row:any)=> {      
        this.selectDefaultPlanOffer(row)
      });
    }
  let customerNameForLinkCustomer = localStorage.getItem("customerNameForLinkCustomer");
    if (customerNameForLinkCustomer !== undefined && customerNameForLinkCustomer !== null && customerNameForLinkCustomer !== '') {
      this.customerName = localStorage.getItem("customerNameForLinkCustomer");
    }
  }

  ngOnInit(): void {
    this._cdRef.detectChanges();
    const subscription = this._onboardService.receiveDataInChild().pipe(takeUntil(this.destroy$)).subscribe(response => {
      if (response.type === EVENT_TYPE.EVENT_ONBOARD_UPDATE_DATA_TO_SHARED_NON_SHARED_CHILD) {
        this.onboardCustomerModel = response.data.onboardCustomerModel;
        this.customerC3Id = response.data.customerC3Id;
        this.loadingSubscriptions = response.data.loadingSubscriptions;
        this.subscriptionsList = response.data.subscriptionsList;
        this.pageVisibleList = response.data.pageVisibleList;
        this.subscriptionsList.forEach((row:any)=> {      
          this.selectDefaultPlanOffer(row)
        });
      }
      this._cdRef.detectChanges();

    });
    let customerType = localStorage.getItem("customerType");
    if( this.customerName && !customerType ){
      let title = this._translateService.instant('TRANSLATE.SERVICE_PROVIDER_TENANT_HEADER');
      title = title + ` <span class="text-primary">${this.customerName}</span>`
      this._pageInfo.updateTitle(title, true);
        if (this._commonService.entityName === 'Reseller') {
          this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
        }
        else if (this._commonService.entityName === 'Partner') {
          this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE', 'SERVICE_PROVIDER_TENANT', 'DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER']);
        }
      }
      else if (this.customerName && customerType ) {
        let title = this._translateService.instant('TRANSLATE.LINK_CUSTOMER_HEADER_TEXT');
        title = title + ` <span class="text-primary">${this.customerName}</span>`
        this._pageInfo.updateTitle(title, true);
        this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS', 'SERVICE_PROVIDER_TENANT', 'DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER']);
         if (this._commonService.entityName === 'Reseller') {
             this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS', 'SERVICE_PROVIDER_TENANT', 'DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER']);
         }
         else if (this._commonService.entityName === 'Partner') {
             this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'CUSTOMER_SUBSCRIPTIONS_CAPTION_TEXT_CUSTOMERS', 'SERVICE_PROVIDER_TENANT', 'DROPDOWN_MENU_BUTTON_TEXT_TO_LINK_SINGLE_PROVIDER']);
         }

      }
      else {
        this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_SUBSCRIPTIONS_BUTTON_TEXT_ONBOARD_CUSTOMER"), true);
        if (this._commonService.entityName === 'Reseller') {
          this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
        } else if (this._commonService.entityName === 'Partner') {
          this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE']);
        }
      }
      this._subscriptionArray.push(subscription);
  }

  selectPlanProductId(row: any, planProduct: any) {
    let index = this.subscriptionsList.indexOf(row);
    this.subscriptionsList[index].MappedC3PlanProductId = planProduct.PlanProductId;
    this.subscriptionsList[index].IsPrimaryInLinkedProduct = planProduct.IsPrimaryInLinkedProduct;
    this.subscriptionsList[index].LinkedProductId = planProduct.LinkedProductId;
    this.subscriptionsList[index].IsPromotionAvailableForCustomer = planProduct.IsPromotionAvailableForCustomer;
    let data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_SUBSCRIPTION_DATA_CHANGE,
      data: {
        SubscriptionList: this.subscriptionsList
      }
    }

    this._onboardService.sendNotification(data);
    this._cdRef.detectChanges();
  }

  takeOnProviderSubscription(row: any) {
    let data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_TAKE_PROVIDER_SUBSCRIPTION_FUNCTION,
      data: {
        Product: row
      }
    }

    this._onboardService.sendNotification(data);
    this._cdRef.detectChanges();
  }

  skipProviderSubscription(row: any) {
    let data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_SKIP_PROVIDER_SUBSCRIPTION_FUNCTION,
      data: {
        Product: row
      }
    }

    this._onboardService.sendNotification(data);
  }

  collectCustomerDetails() {
    let data: DataSharingModel = {
      type: EVENT_TYPE.EVENT_ONBOARD_CUSTOMER_COLLECT_CUSTOMER_DETAILS_FUNCTION,
      data: {
        SubscriptionList: this.subscriptionsList
      }
    }

    this._onboardService.sendNotification(data);
    this._cdRef.detectChanges();
  }



  getProviderPromotionsDetails(providersubscription:any) {
    var data = {
        PromotionId: providersubscription.PromotionId,
        ProviderName: providersubscription.ProviderName,
        CategoryName: providersubscription.CategoryName
    };

    const subscription = this._commonService.getPromotionDetailFromProvider(data).pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
      this.productspromotionsdetails = response.Data;
        let promotionDetail = this.productspromotionsdetails.find((item:any)=> {
            return item.Validity == providersubscription.Validity && item.ValidityType == providersubscription.ValidityType && item.BillingCycleId == providersubscription.BillingCycleId;
        });

        let promotionDetails:any = {
            Name: promotionDetail.Name,
            PromotionalId: promotionDetail.PromotinalId,
            Description: promotionDetail.Description,
            Validity: promotionDetail.Validity,
            ValidityType: promotionDetail.ValidityType,
            BillingCycleName: providersubscription.BillingCycleName,
            BillingCycleDescriptionKey: providersubscription.BillingCycleDescription,
            Discount: (promotionDetail.DiscountType == 'PercentDiscount' && promotionDetail.Discount != undefined && promotionDetail.Discount != null && promotionDetail.Discount != '') ? ((promotionDetail.Discount * 100).toFixed(2)) : promotionDetail.Discount,
            DiscountType: promotionDetail.DiscountType,
            EndDate: promotionDetail.EndDate
        };

      /* selecting Size of popup based on condition */
      const config: NgbModalOptions = {
        modalDialogClass: MODAL_DIALOG_CLASS,
      };
      const modalRef = this._modalService.open(PromotionDetailComponent, config);
      modalRef.componentInstance.promotionDetail = promotionDetails;
    });
    this._subscriptionArray.push(subscription);
  }

  selectDefaultPlanOffer(row:any){
    let index = this.subscriptionsList.indexOf(row);
      
    var selectedPlanProduct = row.MappingC3PlanProducts?.filter((planProducts:any)=> {
        return planProducts?.PlanProductId === row?.MappedC3PlanProductId;
    })[0];
  
    if (selectedPlanProduct !== undefined && selectedPlanProduct !== null) {
        this.subscriptionsList[index].MappedC3PlanProduct = selectedPlanProduct;
        this.subscriptionsList[index].MappedC3PlanProductId = selectedPlanProduct.PlanProductId;
        this.subscriptionsList[index].IsPromotionAvailableForCustomer = selectedPlanProduct.IsPromotionAvailableForCustomer;
    }
    if (this.subscriptionsList[index].MappingC3PlanProducts !== null) {
        var model:any = {
            RowNumber: -1,
            ID: null,
            MappedC3PlanProductId: null,
            MappedC3Products: null,
            MappingC3PlanProducts: null,
            SerializedMappedC3Products: null,
            PlanOfferQualifiedOfferName: this._translateService.instant('TRANSLATE.SELECT_DEFAULT_OPTION_SELECT'),
            IsCustom: true
        };
      
        this.subscriptionsList[index].MappingC3PlanProducts.push(model);
    }
  }
    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
      this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    }
  
}
