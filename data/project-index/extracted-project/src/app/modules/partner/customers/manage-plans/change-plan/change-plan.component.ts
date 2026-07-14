import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ManagePlansService } from '../../services/manage-plans.service';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { PurchasedProducts, SourcePlans, TargetPlans } from '../models/manage-plan/manage-plan.module';
import _ from 'lodash';
import { ToastService } from 'src/app/services/toast.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { Location } from '@angular/common';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-change-plan',
  templateUrl: './change-plan.component.html',
  styleUrl: './change-plan.component.scss'
})
export class ChangePlanComponent extends C3BaseComponent implements OnInit, OnDestroy ,AfterViewInit{
  datatableConfig: ADTSettings;
  customerC3Id: string | null;
  SourcePlans: SourcePlans[] = [];
  TargetPlans: TargetPlans[] = [];
  SelectedSourcePlans: any = {};
  CombinedSourcePlanIds: string = "";
  IsShowSubmit: boolean = false;
  SelectedTargetPlan: any = null;
  IsUnAssignPlan: boolean = false;
  IsAllChecked: boolean = false;
  IsInvalidSourcePlans: boolean = false;
  showHelpText: boolean = false;
  IsAllMapped: boolean = true;
  CanUnassignPlan: boolean = true;
  PurchasedProducts: PurchasedProducts[] = [];
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  @ViewChild('checkboxTemplate') checkboxTemplate: TemplateRef<any>;
  @ViewChild('mappedTemplate') mappedTemplate: TemplateRef<any>;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  
  selectedCustomerRecord: any = [];
  customerName: any;
  isAllMatchingProductsAvailable: boolean = true;


  constructor(
    private _ManagePlanService: ManagePlansService,
    private _translateService: TranslateService,
    private _cdRef: ChangeDetectorRef,
    private _toastService: ToastService,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _pageInfo:PageInfoService,
    private _appService: AppSettingsService,
    private _location: Location

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    const navigation = this._router.getCurrentNavigation();
    this.customerC3Id = navigation?.extras.state?.['customerC3Id'];
    if (this.customerC3Id === undefined || this.customerC3Id === null || this.customerC3Id === '') {
      _router.navigate(['partner/customers']);
    }

    this.customerName = navigation?.extras.state?.['customerName'];
    if (this.customerName === undefined || this.customerName === null || this.customerName === '') {
      _router.navigate(['partner/customers']);
    }

  }

  // AT-1124 Remove once change plan is stable
  // handleSelection(event: any) {
  //   debugger; 
  //   this.selectedCustomerRecord = event;
  //   if (this.selectedCustomerRecord && this.selectedCustomerRecord.length > 0) {
  //     this.selectedCustomerRecord.forEach(record => {
  //       record.IsChecked = true;
  //     });
  //   } else {
  //     this.selectedCustomerRecord.forEach(record => {
  //       record.IsChecked = false;
  //     });
  //   }
  //   this.IsShowSubmit = this.selectedCustomerRecord && this.selectedCustomerRecord.length > 0;
  // }

  handleSelection(event: any) {

    // Iterate through the selectedCustomerRecord (which is the event) to update IsChecked
    event.forEach(record => {
      // Mark the selected products as checked
      record.IsChecked = true;
      // const selectedRecord = this.selectedCustomerRecord.find(r => r.Id === record.Id);
      //   if (selectedRecord) {
      //     selectedRecord.IsChecked = true;
      //     record.isCheckBoxChecked = true;
      //   } else {
      //     //this.selectedCustomerRecord.push(record);
      //     record.IsChecked = true;
      //     record.isCheckBoxChecked = true;
      //   }
    });

    // Iterate through the previously selected products to uncheck those not in the event
    this.selectedCustomerRecord.forEach(record => {
      if (!event.includes(record)) {
        // If the product is not in the event (deselected), set IsChecked to false
        record.IsChecked = false;
        //record.isCheckBoxChecked = false;
      }
    });

    // Update the selectedCustomerRecord with the event (without modifying the array contents)
    this.selectedCustomerRecord = [...event];

    // Show or hide the submit button based on whether any records are selected
    this.IsShowSubmit = this.selectedCustomerRecord.length > 0;
  }

  // Lifecycle hook to run initialization code

  ngOnInit(): void {
    this.getSourcePlans();
  }

  
  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title: string = this._translateService.instant('TRANSLATE.PARTNER_CUSTOMER_PLANS_PAGE_TITLE');
    title= title+`<span class="text-primary">${this.customerName}</span>`
    this._pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT']);
    this._pageInfo.updateTitle(title, true);
  }


  handleTableConfig() {
    this.datatableConfig = null;
    this._cdRef.detectChanges();
    const self = this;
   // this.IsUnAssignPlan = false;
    //this.IsAllChecked = false;
    const requestBody = {
      CustomerC3Id: this.customerC3Id,
      CurrentPlanInternalIds: this.CombinedSourcePlanIds,
      TagetPlanInternalId: this.SelectedTargetPlan.InternalPlanId
    };
    const subscription =  this._ManagePlanService.comparePlanOffers(requestBody,this.PurchasedProducts).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.PurchasedProducts = Data;
      this.PurchasedProducts.forEach((obj: any) => {
        // obj.IsChecked = false;
        // if(this.IsUnAssignPlan){
        //   obj.IsChecked = true;
        //   const selectAllCheckbox = document.querySelector('input.dt-checkboxes') as HTMLInputElement;
        // }
        //obj.isCheckBoxChecked = obj.IsChecked;
        obj.disableCheckBox = obj.TargetPlanProducts.length == 0
      });
     
      setTimeout(() => {
        this.datatableConfig = {
          data: Data,
          serverSide: false,
          paging: false,
          info: false,
          columns: [
            {
              title: this._translateService.instant('TRANSLATE.CHANGE_PLAN_TABLE_HEADER_TEXT_PURCHASED_PRODUCTS'),
              defaultContent: '',
              orderable: false, 
              ngTemplateRef: {
                ref: this.nameTemplate,
              },
              className: "col-md-6 text-start fw-bold"
            },
            {
              title: this._translateService.instant('TRANSLATE.CHANGE_PLAN_TABLE_HEADER_TEXT_MAPPED_PRODUCTS'),
              defaultContent: '',
              orderable: false,
              ngTemplateRef: {
                ref: this.mappedTemplate,
              },
              className: "col-md-6 text-wrap text-start pe-3"
            }
          ],
        };
        this._cdRef.detectChanges();
      });
    });
    this._subscriptionArray.push(subscription);
  }

  getSourcePlans() {

    this.SelectedSourcePlans = {};
    this.SourcePlans = [];
    const subscription = this._ManagePlanService.getSourcePlans(this.customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.SourcePlans = response.Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getTargetPlans(sourcePlans: string) {
    if (sourcePlans === '' || sourcePlans === null) {
      this.TargetPlans = [];
      return;
    } 
    //ajmal:todo: Nexted subscription
    return this._ManagePlanService.getTargetPlans(sourcePlans).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.TargetPlans = response.Data;
      this.IsUnAssignPlan = false;
      this._cdRef.detectChanges();
    })
  }

  BackToPlanAssignment() {
    this._location.back()
    //const c3Id = this.customerC3Id;
    //this._router.navigate([`partner/customers/${c3Id}/manageplans`]);
  }

  OnSourcePlansChange(selectedSourcePlans: any) {
    this.datatableConfig = null;
    let sourcePlanCombined = "";
    this.IsInvalidSourcePlans = false;
    let currencyDetails: any[] = [];
    this.TargetPlans = [];
    this.SelectedTargetPlan = null;
    this.PurchasedProducts = [];
    this.IsShowSubmit = false;
    this.IsUnAssignPlan = false;
    this.IsAllChecked = false;

    _.each(selectedSourcePlans, (sPlan: any) => {
      currencyDetails.push(sPlan.CurrencyDetails);
      if (sourcePlanCombined === "") {
        sourcePlanCombined = sPlan.InternalPlanId;
      }
      else {
        sourcePlanCombined = sourcePlanCombined + "," + sPlan.InternalPlanId;

      }
    });


    this.CombinedSourcePlanIds = sourcePlanCombined;

    _.each(currencyDetails, (currency: any) => {
      if (currencyDetails[0] != currency) {
        this.IsInvalidSourcePlans = true;
      }

    });

    if (!this.IsInvalidSourcePlans)
      this.getTargetPlans(sourcePlanCombined);
  }

  comparePlanOffers() {
    this.handleTableConfig();
  }

  OnRemoveSourcePlans(items: any) {
    this.OnSourcePlansChange(this.SelectedSourcePlans);
  }

  rowChecked(data: any) {
    this.IsShowSubmit = false;
    this.IsAllChecked = true;

    this.PurchasedProducts.forEach(pProducts => {
      if (pProducts.IsChecked) {
        this.IsShowSubmit = true;
      }
      else {
        this.IsUnAssignPlan = false;
        this.IsAllChecked = false;
      } 
      if (pProducts.TargetPlanProducts.length == 0) {
        this.IsAllMapped = false;
      }
    });
  }

  submitChangePlan() {

    let mappedProductList: any[] = [];
    let invalidForm = false;

    this.PurchasedProducts.forEach(pProducts => {
      if (pProducts.IsChecked) {
        if (pProducts.MappedPlanProducts == null || pProducts.MappedPlanProducts.length == 0) {
          invalidForm = true;
        }
        else {
          mappedProductList.push({
            "InternalCustomerProductId": pProducts.InternalCustomerProductId,
            "NewPlanProductId": pProducts.MappedPlanProducts.TargetPlanProductId,
            "CurrentStatus": pProducts.CurrentStatus
          });
        }
      }
    });

    invalidForm = mappedProductList.length == 0;

    if (!invalidForm) {
      const requestBody = {
        NewPlanInternalId: this.SelectedTargetPlan.InternalPlanId,
        OldPlanInternalId: this.CombinedSourcePlanIds,
        UnAssignCurrentPlan: this.IsUnAssignPlan,
        RecordId: this.customerC3Id,
        SubscriptionList: JSON.stringify(mappedProductList)
      };

      const subscription = this._ManagePlanService.submitChangePlan(requestBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Status === 'Success') {

          this._toastService.success(this._translateService.instant('TRANSLATE.CHANGE_PLAN_SUCCESS_MESSAGE_TEXT'));
          this.getSourcePlans();
          this.OnSourcePlansChange(this.SelectedSourcePlans);
        }
        else {
          let result = response.Data;
          if (result != null && result != undefined && result.length > 0) {
            let commaSeperatedErrors: string = null;
            let messageArray = [];

            result.forEach((error: any) => {
              messageArray = error.ErrorMessage.split('|');
              let message = '';
              if (messageArray.length == 2)
                message = this._translateService.instant(messageArray[0], { firstProduct: messageArray[1] || ''});
              else
                message = this._translateService.instant(messageArray[0], { firstProduct: messageArray[1] || '', secondProduct: messageArray[2] || '' });

              if (commaSeperatedErrors !== null) {
                commaSeperatedErrors = commaSeperatedErrors + " , " + message;
              }
              else {
                commaSeperatedErrors = message;
              }
            });
            this._toastService.error(this._translateService.instant(commaSeperatedErrors));
          }
          else {
            this._toastService.error(this._translateService.instant('TRANSLATE.CHANGE_PLAN_FAILURE_MESSAGE_TEXT'));
          }
        }
        this._cdRef.detectChanges();
      });
      this._subscriptionArray.push(subscription);
    }
  }

  areAllProductsMapped(): boolean {
    return this.PurchasedProducts.every((pProducts: any) => pProducts.TargetPlanProducts.length > 0);
  }
  
  onClickUnAssignPlan() {
    this.IsAllMapped = this.areAllProductsMapped();
    if (this.IsUnAssignPlan) {
      this.IsAllChecked = true;
      this.PurchasedProducts.forEach((pProducts: any) => {
        if (pProducts.TargetPlanProducts.length > 0) {
          pProducts.IsChecked = this.IsUnAssignPlan;
          pProducts.isCheckBoxChecked = this.IsUnAssignPlan;
          this.IsShowSubmit = this.IsUnAssignPlan;
        } else {
          this.IsAllMapped = false;
        }
      });
      this.IsUnAssignPlan = this.IsAllMapped;
    }
    this.isAllMatchingProductsAvailable = this.PurchasedProducts.every(p => p.TargetPlanProducts.length > 0);
    this.handleTableConfig();
  }

  allRowChecked() {
    this.IsAllMapped = true;
    this.PurchasedProducts.forEach((pProducts: any) => {
      if (pProducts.TargetPlanProducts.length > 0) {
        pProducts.IsChecked = this.IsAllChecked;
        this.IsShowSubmit = pProducts.IsChecked;
      } else {
        this.IsAllMapped = false;
      }
    });
  }

  selectedOffer(row: any) {
    this.PurchasedProducts.forEach((pProducts: any) => {
      if (pProducts.TargetPlanProducts.length > 0 && pProducts.CurrentParentPlanProductId === row.CurrentPlanProductId) {
        pProducts.MappedPlanProducts = {};
        const targetParentPlanProductId = row.MappedPlanProducts.TargetPlanProductId;
        pProducts.TargetPlanProducts.forEach((tProducts: any) => {
          if (tProducts.targetParentPlanProductId === targetParentPlanProductId) {
            pProducts.MappedPlanProducts = tProducts;
          }
        });
      }
    });
  }
  formattedCurrentCategoryName(value:any){
    if(value!='OnlineServicesNCE'){
      let formatted = value.replace(/([a-z])([A-Z])/g, '$1 $2');
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
      return formatted;
    }
    else{
      return value;
    }
  }
  // Lifecycle hook to clean up resources

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
