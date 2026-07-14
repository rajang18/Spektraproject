import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnChanges,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ToastService } from 'src/app/services/toast.service';

import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { PlanSeatLimitService } from 'src/app/services/plan-seat-limit-service';
import { Router } from '@angular/router';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { MODAL_DIALOG_CLASS, PromotionDetailsPopupConfig } from 'src/app/shared/models/promoton-details.model';
import { PromotionDetailComponent } from 'src/app/modules/standalones/promotion-detail/promotion-detail.component';
import { CommonService } from 'src/app/services/common.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { takeUntil } from 'rxjs';
// import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'plan-products-seat-limit',
  templateUrl: './planproductseatlimits.component.html',
  styleUrl: './planproductseatlimits.component.scss'
})
export class PlanProductsSeatLimit extends C3BaseComponent implements OnInit, OnDestroy, OnChanges {


  datatableConfig: ADTSettings;
  isEditing: boolean[] = [];
  // _subscription: Subscription;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  modalContent: any;
  promotionModalRef: NgbModalRef
  planId: number;
  planName: string;
  planProductsData: [];
  planSeatLimit: number;
  showtable: boolean = true;
  showHelpText: boolean = false;

    @ViewChild("planname") planname: TemplateRef<any>;
    @ViewChild("saleprice") saleprice: TemplateRef<any>;
    @ViewChild("action") action: TemplateRef<any>;
    @ViewChild("promotion") promotion: TemplateRef<any>;
    @ViewChild("promotiontemplate") promotiontemplate:TemplateRef<any>;
   // @ViewChild('actionHeader') actionHeader: TemplateRef<any>;
    // Reload emitter inside datatable
    reloadEvent: EventEmitter<boolean> = new EventEmitter();
    constructor(
      private toastService: ToastService,
      private modalService: NgbModal,
      private cdRef: ChangeDetectorRef,
      private translateService: TranslateService,
      private router:Router,
      private planSeatLimitService:PlanSeatLimitService,
      public permissionService: PermissionService,
      public pageInfo: PageInfoService,
      public dynamicTemplateService: DynamicTemplateService,
      private _appService: AppSettingsService,
      private _commonService:CommonService,
      private c3RouterService:C3RouterService
    ) {
      super(permissionService, dynamicTemplateService, router, _appService);
      this.navigation = this._router.getCurrentNavigation();
      this.planId = this.navigation?.extras.state?.id;
      this.planName = this.navigation?.extras.state?.name;

      if(this.planId == undefined || this.planId == null){
        this.router.navigate(['partner/plans']);
      }
    }


  ngOnInit(): void {
    // call table function
    this.handleTableConfig();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title: string = this.translateService.instant('TRANSLATE.PARTNER_PLAN_PRODUCT_SEAT_LIMITS_LABEL_TEXT',{PlanName:this.planName});
    title = title.includes(this.planName) ? (title.replace(this.planName,`<span class="text-primary">${this.planName}</span>`)) : title
    this.pageInfo.updateTitle(title, true, true);
    if(this._commonService.entityName === 'Reseller'){
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL','PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS']);
    }
    else if(this._commonService.entityName === 'Partner'){
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'PLAN_MANAGE_BREADCRUMB_BUTTON_PLANS']);
    }
  }

  ngOnChanges(): void {
    this.cdRef.detectChanges();
  }

  handleTableConfig = () => {
    var self = this;
    this.datatableConfig = null;
    this.cdRef.detectChanges();
    const subscription = this.planSeatLimitService.getList({ PlanId: this.planId }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.showtable = true;
      // const {Data} = response;
      // just in case the total records isnt present in the sp
      // assign either 0 or take the length of the response array
      //const [{TotalRows: recordsTotal = (Data.length || 0)}= {}] = Data;

      // showing the plan seat limit on the top of the table
      this.planSeatLimit = (Data[0]?.PlanSeatLimit ?? 0);

      // setting page mode
      Data = Data.map((each: any) => {



        if (each.IsOverridePlanSeat == 0 || each.IsOverridePlanSeat == false) {
          each.pageMode = false;
        }
        else {
          each.pageMode = true;
        }

        //  MaximumSeatsAllowed if undefined or null initialize with 0

        if (each?.MaximumSeatsAllowed == null || each?.MaximumSeatsAllowed == undefined) {
          each.MaximumSeatsAllowed = 0;
        }

        each.OriginalSeatLimit = each.MaximumSeatsAllowed;
        return each;

      });

      Data = Data?.filter((e: any) => e.CompositeProductId === null)

      setTimeout(() => {
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
          data: Data, // assigning the data received from the api
          columns: [
            {
              type: "string",
              title: this.translateService.instant('TRANSLATE.PLAN_PRODUCTS_SEAT_LIMITS_DETAILS_TABLE_HEADER_PRODUCT_NAME'),
              className: "col-md-8 text-wrap",
              searchable: true,
              data: 'PlanProductName',
              defaultContent: '',
              ngTemplateRef: {
                ref: this.planname,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              },
            },
            {
              type: "string",
              title: this.translateService.instant('TRANSLATE.PLAN_PRODUCTS_SEAT_LIMITS_DETAILS_TABLE_HEADER_SALE_PRICE'),
              className: "col-md-2 text-end pe-4",
              defaultContent: '',
              orderable: false,
              ngTemplateRef: {
                ref: this.saleprice,
                context: {
                  captureEvents: self.onCaptureEvent.bind(this)
                }
              }
            },
            {
              type: "string",
              title: this.translateService.instant('TRANSLATE.PLAN_PRODUCTS_SEAT_LIMITS_DETAILS_TABLE_HEADER_NUMBER_OF_SEATS'),
              className: "text-center col-md-2",
              orderable: false,
              defaultContent: "",
              ngTemplateRef: {
                ref: this.action,
                context: {
                  captureEvents: self.onCaptureEvent.bind(this)
                }
              }
            }
          ]
        }
        this.cdRef.detectChanges();
      })
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }


  onCaptureEvent(event: Event) { }

  enableEditField(data: any) {

  }
  // not much functionality inside the promotion popup hence using TemplateRef
  checkNcePromotionDetails = (payload: any) => {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = payload?.PromotionName,
      promotionDetailsConfig.PromotionalId = payload?.NCEPromotionID,
      promotionDetailsConfig.Description = payload?.PromotionDescription,
      promotionDetailsConfig.Validity = payload?.Validity,
      promotionDetailsConfig.ValidityType = payload?.ValidityType,
      promotionDetailsConfig.BillingCycleName = payload?.BillingCycleName,
      promotionDetailsConfig.BillingCycleDescriptionKey = payload?.BillingCycleDescription,
      promotionDetailsConfig.Discount = payload?.PromotionDiscount,
      promotionDetailsConfig.DiscountType = payload?.PromotionDiscountType,
      promotionDetailsConfig.EndDate = payload?.PromotionEndDate
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this.modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  checkLinkedProductNcePromotionDetails = (payload: any) => {
    /* Creating config model */
    let promotionDetailsConfig = new PromotionDetailsPopupConfig();
    promotionDetailsConfig.Name = payload?.LinkedProductPromotionName,
      promotionDetailsConfig.PromotionalId = payload?.NCELinkedProductPromotionID,
      promotionDetailsConfig.Description = payload?.LinkedProductPromotionDescription,
      promotionDetailsConfig.Validity = payload?.LinkedProductValidity,
      promotionDetailsConfig.ValidityType = payload?.LinkedProductValidityType,
      promotionDetailsConfig.BillingCycleName = payload?.LinkedProductBillingCycleName,
      promotionDetailsConfig.BillingCycleDescriptionKey = payload?.BillingCycleDescription,
      promotionDetailsConfig.Discount = payload?.LinkedProductPromotionDiscount,
      promotionDetailsConfig.DiscountType = payload?.LinkedProductPromotionDiscountType,
      promotionDetailsConfig.EndDate = payload?.LinkedProductPromotionEndDate
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: MODAL_DIALOG_CLASS,
    };
    const modalRef = this.modalService.open(PromotionDetailComponent, config);
    modalRef.componentInstance.promotionDetail = promotionDetailsConfig;
    modalRef.result.then((result) => {
    },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      });
  }

  setPlanProductWiseSeatLimit(product: any){
    product.IsOverridePlanSeat = 1;
    product.pageMode = true;
    product.MaximumSeatsAllowed = 0;
    product.OriginalSeatLimit = null;
  }

  //update the seat limit
  UpdateSeatLimit = (product: any, mode: string) => {
    
    if (mode == "update") {
      product.IsOverridePlanSeat = 1;
      product.pageMode = true;
    }
    else {


      product.MaximumSeatsAllowed = 0;
      product.pageMode = false;
      product.OriginalSeatLimit = null;
      product.IsOverridePlanSeat = 0;
    }
    this.cdRef.detectChanges();
  }


  SubmitProducts = () => {
    this.cdRef.detectChanges();
    var isInvalidData = null;
    isInvalidData = this.datatableConfig.data?.find(e => {
      if (e.MaximumSeatsAllowed === undefined || e.MaximumSeatsAllowed === '' || e.MaximumSeatsAllowed === null) {
        return e;
      }
    });
    if (isInvalidData != undefined) {
      var productName = isInvalidData?.PlanProductName;
      // check if any 
      this.toastService.error(this.translateService.instant("TRANSLATE.PLAN_PRODUCTS_SEAT_LIMITS_INVALID_SEAT_MESSAGE", { PlanProductName: productName }));
    }
    else {
      // api call
      let modifiedData = this.datatableConfig?.data.filter(data => data.MaximumSeatsAllowed != data.OriginalSeatLimit);
      var stringifiedData = JSON.stringify(modifiedData);
      const subscription = this.planSeatLimitService.SubmitProducts(this.planId, stringifiedData).pipe(takeUntil(this.destroy$)).subscribe(({ response }: any) => {
        //toaster for success
        this.toastService.success(this.translateService.instant("TRANSLATE.PLAN_PRODUCTS_SEAT_LIMITS_UPDATE_SUCCESS_MESSAGE"));
        // reload the table
        //this.handleTableConfig()
        this.showtable = false;
        //this._subscription?.unsubscribe();
        this.handleTableConfig();
      });
      this._subscriptionArray.push(subscription);


      // this.showtable= false;
      // //this._subscription?.unsubscribe();
      // this.handleTableConfig();
    }
  }

  backToList(){
    this.c3RouterService.backToHistory(this.keyForData,`partner/plans`);
  }
}
