import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Nodes } from 'src/app/modules/partner/settings/models/user-management';
import { CommonService } from 'src/app/services/common.service';
import { ReconciliationReportService } from '../../../services/reconciliation-report.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { Select2Data } from 'ng-select2-component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { decimalValidator } from 'src/app/shared/validators/custom-validators';
declare const $: any;

@Component({
    selector: 'app-csp-products-mapped-to-planproducts-popup',
    templateUrl: './csp-products-mapped-to-planproducts-popup.component.html',
    styleUrl: './csp-products-mapped-to-planproducts-popup.component.scss'
})
export class CspProductsMappedToPlanproductsPopupComponent extends C3BaseComponent implements OnInit, OnDestroy {
    @Input() subscriptionsList: any;
    @Input() customerPlans: any;
    filterMappedsubscriptionsList: any;
    node: Nodes;
    entityName: string | null = '';
    recordId: string | null = '';
    customerId: number | null = 0;
    customerC3Id: string | null = '';
    customerName: string | null = '';
    categoryName: string = null;
    selectedPlan: any;
    selectedOffer: any;
    riSalePrice: any = null;
    productList: any[];
    SelectedPromotion: any;
    mappingC3PlanProductsDataset: Select2Data = [];
    customerPlansDataset: Select2Data = [];
    filterMappingC3PlanProductsDataset: Select2Data = [];
    mappingC3PlanProductsDatasetDict: { [key: string]: Select2Data } = {};
    isEditMode: boolean = false;
    filterMappedsubscriptionsListMappingC3PlanProductsDataset: Select2Data = [];
    reservedInstanceFormGroup: FormGroup;
    isRiSyncFormSubmitted: boolean = false;
    SyncedSubscriptionDataset: Select2Data = [];
    SyncedSubscriptionName: string | null = '';
    sameNameList: any[];
    constructor(
        public _modalService: NgbModal,
        public activeModal: NgbActiveModal,
        private _translateService: TranslateService,
        private _commonService: CommonService,
        private _reconciliationReportService: ReconciliationReportService,
        private _notifierService: NotifierService,
        public _router: Router,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private _formBuilder: FormBuilder,
        private _unsavedChangesService: UnsavedChangesService,
        private _appService: AppSettingsService,
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.reservedInstanceFormGroup = this._formBuilder.group({
            planName: ['', Validators.required],
          //  planProductName: [''],
          syncedSubscriptionName: ['', Validators.required],
            salePrice: ['', [Validators.required, Validators.min(0), decimalValidator]]
        })


    }

  ngOnInit(): void {

    if (this.subscriptionsList[0].ProviderSubscriptionSkuName == null) {
      this.subscriptionsList[0].ProviderSubscriptionSkuName = '';
    }

    if (this.subscriptionsList[0].ProviderSubscriptionSkuName.includes(this.subscriptionsList[0].ProviderSubscriptionOfferName)) {
      this.SyncedSubscriptionDataset.push({
        value: this.subscriptionsList[0].ProviderSubscriptionSkuName,
        label: this.subscriptionsList[0].ProviderSubscriptionSkuName,
        disabled: this.isEditMode,
        data:
          { Name: this.subscriptionsList[0].ProviderSubscriptionSkuName, Type: 'PlanProductWithSkuName' }
      });

    }
    else {
      this.SyncedSubscriptionDataset.push({
        value: this.subscriptionsList[0].ProviderSubscriptionOfferName + '-' + this.subscriptionsList[0].ProviderSubscriptionSkuName,
        label: this.subscriptionsList[0].ProviderSubscriptionOfferName + '-' + this.subscriptionsList[0].ProviderSubscriptionSkuName,
        disabled: this.isEditMode,
        data:
          { Name: this.subscriptionsList[0].ProviderSubscriptionOfferName + '-' + this.subscriptionsList[0].ProviderSubscriptionSkuName, Type: 'PlanProductWithSkuName' }
      });
    }
    this.SyncedSubscriptionDataset.push({
      value: this.subscriptionsList[0].ProviderSubscriptionFriendlyName,
      label: this.subscriptionsList[0].ProviderSubscriptionFriendlyName,
      disabled: this.isEditMode,
      data:
        { Name: this.subscriptionsList[0].ProviderSubscriptionFriendlyName, Type: 'FriendlyName' }
    });

    this.SyncedSubscriptionName = this.subscriptionsList[0].ProviderSubscriptionFriendlyName;
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.subscriptionsList.forEach((value: any) => {
      this.mappingC3PlanProductsDataset = [];
      //Forming dataset for select 2 mapping offer
      value.MappingC3PlanProducts.forEach((planProduct: any) => {
        this.mappingC3PlanProductsDataset.push({
          value: planProduct,
          label: planProduct.PlanOfferQualifiedOfferName,
          disabled: this.isEditMode,
          data: { PlanOfferQualifiedOfferName: planProduct.PlanOfferQualifiedOfferName, BillingTypeName: planProduct.BillingTypeName, PlanName: planProduct.PlanName, CurrencySymbol: planProduct.CurrencySymbol, FinalSalePrice: planProduct.FinalSalePrice }
        });
      })
      this.mappingC3PlanProductsDatasetDict[value.ProviderSubscriptionOfferId] = this.mappingC3PlanProductsDataset
    })
    //Forming dataset for select2 for customer plans
    this.customerPlans.forEach((plan: any) => {
      this.customerPlansDataset.push({
        value: plan,
        label: plan.Name,
        disabled: this.isEditMode,
        data: { Name: plan.Name }
      })
    })
    this.filterMappedsubscriptionsList = JSON.parse(JSON.stringify(this.subscriptionsList));
    this.filterMappedsubscriptionsList[0].MappingC3PlanProducts = [];
    this.categoryName = this.subscriptionsList[0].CategoryName;
    if (this.categoryName == null) {
      this.categoryName = '';
    }
    if (this.entityName === 'Partner' || this.entityName === 'Reseller') {
      var customerIdInt = localStorage.getItem("ReportCustomerID");
      if (customerIdInt != null) {
        this.customerId = Number(customerIdInt);
      }
      this.customerC3Id = localStorage.getItem("ReportC3CustomerID"),
        this.customerName = localStorage.getItem("ReportCustomerName")
    }
    else {
      this.customerC3Id = this.recordId;
    }

    }

  proceed(offer: any, isIgnore: boolean) {
    offer.IsIgnore = isIgnore;
    this.isRiSyncFormSubmitted = true;
    if (this.categoryName != null && this.categoryName.toLowerCase() == this.cloudHubConstants.RESERVED_INSTANCES.toLowerCase()) {
      if (this.reservedInstanceFormGroup.valid) {
        offer.riPlanDetails = this.selectedPlan.Name;
        offer.riProductDetails = this.selectedOffer.PlanOfferQualifiedOfferName;
        offer.riSalePrice = this.riSalePrice;
        offer.PlanId = this.selectedPlan.PlanId;
        offer.SyncedSubscriptionName = this.SyncedSubscriptionName;

                let requestBody = {
                    ReservationOrderID: offer.ReservationOrderID,
                    ProviderSubscriptionId: offer.ProviderSubscriptionId,
                    Price: offer.riSalePrice,
                    CustomerC3Id: this.customerC3Id
                }
                this._reconciliationReportService.checkRIExistenceForReservationOrderID(requestBody).subscribe((res: any) => {
                    if (res.Status == "Success") {
                        this.productList = res.Data;
                        this.isRiSyncFormSubmitted = false;
                        let otherProducts = this.productList.filter((product: any) => {
                            return product.ProviderProductId.toLowerCase() !== offer.ProviderSubscriptionId.toLowerCase();
                        });
                        if (otherProducts !== undefined && otherProducts !== null && otherProducts.length > 0 && otherProducts[0].Price != offer.riSalePrice) {
                            const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_RI_PRICE_CONFIRMATION_FOR_SAME_ROID');
                            this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
                                if (result.isConfirmed) {
                                    offer.riSalePrice = otherProducts[0].Price;
                                    this.activeModal.close(offer);
                                }
                                else {
                                    this.activeModal.close(offer);
                                }
                            })
                        }
                        else {
                            this.activeModal.close(offer);
                        }
                    }
                })
            }
        }
        else {
            this.activeModal.close(offer);
        }
    }

    selectPlanProductId(row: any, item: any) {
        row.MappedC3PlanProduct = item.value;
        this.SelectedPromotion = null;
        if (row.MappedC3PlanProduct != null && row.MappedC3PlanProduct.PromotionDetails != null) {
            let promotionObjList = row.MappedC3PlanProduct.PromotionDetails.filter((item: any) => {
                return item?.PromotionID === row.PromotionId;
            });
            if (promotionObjList !== undefined &&
                promotionObjList !== null &&
                promotionObjList.length > 0) {
                this.SelectedPromotion = promotionObjList[0];
            }
        }
        this.selectedOffer = item.value;
        this.riSalePrice = this.selectedOffer.FinalSalePrice;
    }

  SelectSyncedName(row: any, item: any) {
    this.SyncedSubscriptionName = item.value;

  }

  getReservedInstancesProductsForSync(item: any) {
    this.selectedOffer = {};
    this.riSalePrice = 0.00;
    this.selectedPlan = item.value;
    if (this.subscriptionsList[0].MappingC3PlanProducts != null) {
      this.filterMappedsubscriptionsList[0].MappingC3PlanProducts = this.subscriptionsList[0].MappingC3PlanProducts.filter((product: any) => {
        return product.PlanId === item.value.PlanId;
      });

      this.SyncedSubscriptionDataset = this.SyncedSubscriptionDataset.filter((obj: any) => {        
        return obj.data.Type !== 'PlanProductName';
      });
      
      this.filterMappedsubscriptionsListMappingC3PlanProductsDataset = [];

      //Forming dataset for select2 for filter mapping c3 planproducts for reserved instance
      this.filterMappedsubscriptionsList[0].MappingC3PlanProducts.forEach((mappedProduct: any) => {
        this.filterMappedsubscriptionsListMappingC3PlanProductsDataset.push({
          value: mappedProduct,
          label: mappedProduct.PlanOfferQualifiedOfferName,
          disabled: this.isEditMode,
          data: { PlanOfferQualifiedOfferName: mappedProduct.PlanOfferQualifiedOfferName }
        })

        this.sameNameList = [];
        this.sameNameList = this.SyncedSubscriptionDataset.filter((obj: any) => {          
          return obj.data.Name == mappedProduct.PlanOfferQualifiedOfferName;
        });
        if (this.sameNameList.length == 0) {
          this.SyncedSubscriptionDataset.push({
            value: mappedProduct.PlanOfferQualifiedOfferName,
            label: mappedProduct.PlanOfferQualifiedOfferName,
            disabled: this.isEditMode,
            data:
              { Name: mappedProduct.PlanOfferQualifiedOfferName, Type: 'PlanProductName' }
          });
        }

      })
    }
  }

    closeModalPopup() {
        this._modalService.dismissAll();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this._unsavedChangesService.setUnsavedChanges(false);
    }
}
