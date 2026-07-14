import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ReconciliationReportService } from '../../partner/customers/services/reconciliation-report.service';
import { TranslateService } from '@ngx-translate/core';
import { NotifierService } from 'src/app/services/notifier.service';
import { Select2Data, Select2Module } from 'ng-select2-component';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslationModule } from '../../i18n';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { takeUntil} from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';


@Component({
  selector: 'app-billing-cycle-change-mapped-product-popup',
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule, ReactiveFormsModule, TranslationModule, NgbModule, Select2Module],
  templateUrl: './billing-cycle-change-mapped-product-popup.component.html',
  styleUrl: './billing-cycle-change-mapped-product-popup.component.scss'
})
export class BillingCycleChangeMappedProductPopupComponent extends C3BaseComponent implements OnInit,OnDestroy{
  @Input() subscriptionsList: any;
  @Input() customerPlans: any;

  entityName: string | null = '';
  recordId: string | null = '';
  customerId: number | null = 0;
  customerC3Id: string | null = '';
  customerName: string | null = '';
  categoryName: string = null;
  selectedOffer: any;
  riSalePrice: any;
  isAllProductSelected: boolean = false;
  filterMappedsubscriptionsList: any; 
  productList : any[];
  isEditMode : boolean = false;
  mappingC3PlanProductsDataset : Select2Data = [];
  mappingC3PlanProductsDatasetDict : {[key : string]: Select2Data} = {};
  customerPlansDataset: Select2Data = [];
  filterMappedsubscriptionsListMappingC3PlanProductsDataset : Select2Data = [];
  reservedInstanceFormGroup : FormGroup;
  selectedPlan: any;

  constructor(
    private _modalService: NgbModal,
    private _activeModal: NgbActiveModal,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _commonService: CommonService,
    private _reconciliationReportService : ReconciliationReportService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _formBuilder: FormBuilder,
    private _unsavedChangesService: UnsavedChangesService,
    private _appService: AppSettingsService,
  ) {super(_permissionService, _dynamicTemplateService, _router, _appService);
    this.reservedInstanceFormGroup = this._formBuilder.group({
      planName: ['', Validators.required],
      planProductName : [''],
      salePrice : ['', [Validators.required, Validators.min(1)]]
    })

   }

  ngOnInit(): void {
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    if (this.entityName.toLowerCase() === this.cloudHubConstants.ENTITY_PARTNER.toLowerCase() || this.entityName.toLowerCase() === this.cloudHubConstants.ENTITY_RESELLER.toLowerCase()) {
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
   
    this.categoryName = this.subscriptionsList[0].CategoryName;
    this.filterMappedsubscriptionsList = JSON.parse(JSON.stringify(this.subscriptionsList));
    this.filterMappedsubscriptionsList[0].MappingC3PlanProducts = [];
    //Forming dataset for select 2 mapping offer
    this.subscriptionsList.forEach((value: any) => {
      this.mappingC3PlanProductsDataset = [];
      value.MappingC3PlanProducts.forEach((planProduct: any) => {
        this.mappingC3PlanProductsDataset.push({
          value: planProduct,
          label: planProduct.PlanOfferQualifiedOfferName,
          disabled: this.isEditMode,
          data: { PlanOfferQualifiedOfferName: planProduct.PlanOfferQualifiedOfferName, BillingTypeName: planProduct.BillingTypeName, PlanName: planProduct.PlanName, CurrencySymbol: planProduct.CurrencySymbol, FinalSalePrice: planProduct.FinalSalePrice }
        });
      })
      this.mappingC3PlanProductsDatasetDict[value.ProviderSubscriptionId] = this.mappingC3PlanProductsDataset
    })
    //Forming dataset for select2 for customer plans
    this.customerPlans.forEach((plan : any)=>{
      this.customerPlansDataset.push({
        value : plan,
        label : plan.Name,
        disabled: this.isEditMode,
        data: {Name : plan.Name}
      })
     })
  }

  selectPlanProductId(row: any, planProduct: any) {
    row.MappedC3PlanProduct = planProduct.value;
    const index = this.subscriptionsList.findIndex((item: any) => item === row);
    if (index >= 0) {
      this.subscriptionsList[index].MappedC3PlanProductId = planProduct.value.PlanProductId;
      this.subscriptionsList[index].CategoryName = planProduct.value.CategoryName;
    }
    this.selectedOffer = planProduct.value;
    this.riSalePrice = this.selectedOffer.FinalSalePrice;
    this.checkSelectedProductCount();
  }

  checkSelectedProductCount() {
    const PendingProduct = this.subscriptionsList.find((row: any) => {
      return (row.MappedC3PlanProduct === undefined || row.MappedC3PlanProduct === null);
    });
    if (!PendingProduct || PendingProduct.length < 1) {
      this.isAllProductSelected = true;
    }
  }

  getReservedInstancesProductsForSync(item: any) {
    this.selectedOffer = {};
    this.riSalePrice = 0.0;
    this.selectedPlan = item.value;
    if (this.subscriptionsList[0].MappingC3PlanProducts !== null) {
       this.filterMappedsubscriptionsList[0].MappingC3PlanProducts = this.subscriptionsList[0].MappingC3PlanProducts.filter((product: any) => product.PlanId === item.PlanId);
    }
    //Forming dataset for select2 for filter mapping c3 planproducts for reserved instance
    this.filterMappedsubscriptionsList[0].MappingC3PlanProducts.forEach((mappedProduct: any) => {
      this.filterMappedsubscriptionsListMappingC3PlanProductsDataset.push({
        value: mappedProduct,
        label: mappedProduct.PlanOfferQualifiedOfferName,
        disabled: this.isEditMode,
        data: { PlanOfferQualifiedOfferName: mappedProduct.PlanOfferQualifiedOfferName }
      })
    })
  }

  proceed(offer: any, isIgnore : boolean) {
    if (this.categoryName.toLowerCase() === this.cloudHubConstants.RESERVED_INSTANCES.toLowerCase()) {
      offer.riSalePrice = this.riSalePrice;
      //Form validation logic yet to be added
      if(this.reservedInstanceFormGroup.valid){
      let requestBody = {
        ReservationOrderID: offer.ReservationOrderID,
        ProviderSubscriptionId: offer.ProviderSubscriptionId,
        Price: offer.riSalePrice,
        CustomerC3Id: this.customerC3Id
      }
      const subscription = this._reconciliationReportService.checkRIExistenceForReservationOrderID(requestBody).pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
        if (res.Status == "Success") {
          this.productList = res.Data;
          let otherProducts = this.productList.filter((product: any) => {
            return product.ProviderProductId.toLowerCase() !== offer.ProviderSubscriptionId.toLowerCase();
          });
          if (otherProducts !== undefined && otherProducts !== null && otherProducts.length > 0 && otherProducts[0].Price != offer.riSalePrice) {
            const confirmationMessage = this._translateService.instant('TRANSLATE.CUSTOMER_SUBSCRIPTION_MANUAL_SYNC_RI_PRICE_CONFIRMATION_FOR_SAME_ROID');
            this._notifierService.confirm({ title: confirmationMessage }).then((result) => {
              let resultObj = {
                Offer : offer,
                CategoryName : this.categoryName
              } 
              if (result.isConfirmed) {
                offer.riSalePrice = otherProducts[0].Price;
                this._activeModal.close(resultObj);
              }
              else {
                this._activeModal.close(resultObj);
              }
            })
          }
        }
      })
      this._subscriptionArray.push(subscription);
    }
    }
    else {
      let resultObj = {
        Offer : offer,
        CategoryName : this.categoryName
      } 
      this._activeModal.close(resultObj);
    }
  }

  closeModalPopup() {
    this._modalService.dismissAll();
  }
  ngOnDestroy(): void {
    this._unsavedChangesService.setUnsavedChanges(false);
    super.ngOnDestroy();
  }

}
