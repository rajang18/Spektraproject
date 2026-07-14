import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AzureMarginService } from '../../service/azure-margin.service';
import { distinctUntilChanged, from, map, takeUntil } from 'rxjs';
import { orderBy, } from 'lodash';
import { AppSettingsService } from 'src/app/services/app-settings.service';


@Component({
  selector: 'app-azure-margin',
  templateUrl: './azure-margin.component.html',
  styleUrl: './azure-margin.component.scss'
})
export class AzureMarginComponent extends C3BaseComponent implements OnInit, OnDestroy {
  azureForm:FormGroup;
  updateAzureForm:FormGroup;
  customers:any [] = [];
  allTenants:any [] = [];
  Tenants:any [] = [];
  providerTenantsCount:any;
  currentC3CustomerId:any[]= [];
  selectedServiceProviderCustomer:any [] = [];
  subscriptionDataSource:any [] = [];
  allSubscriptions:any [] = [];
  currentSubscription:any [] = [];
  currentSubscriptionId:any;
  customerId:any;
  subscriptionCategories:any [] = [];
  billingPeriods:any;
  billingStartPeriodId:any;
  billingEndPeriodId:any;
  currentTenant:any

  constructor(
    private _formBuilder: FormBuilder,
    private _cdref: ChangeDetectorRef,
    private _azureMarginService: AzureMarginService,
    private _commonService: CommonService,
    public _router: Router,
    private pageInfo: PageInfoService,
    public _notifierService:NotifierService,
    private _toastService: ToastService,
    private _translateService:TranslateService,
    public _permissionService:PermissionService,
    public _dynamicTemplateService:DynamicTemplateService,
    private _appService: AppSettingsService, 
  ) {
    super(_permissionService,_dynamicTemplateService,_router, _appService);
    this.azureForm = this._formBuilder.group({
      selectedCustomer:[''],
      selectedTenent:[''],
      selectedSub:['']
    });

    this.updateAzureForm = this._formBuilder.group({
      startPeriod:['',Validators.required],
      endPeriod:['',Validators.required],
      markup:['',Validators.required],
      reason:[''],
      azureBilling:[''],
      azureEstimate: [true, { value: true, disabled: true }]
    });

  }
  ngOnInit(): void {
    this.getCustomers();
    this.getBillingPeriods();
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.SIDEBAR_C3_SUPPORT_AZURE_MARGIN"),true);
    this.pageInfo.updateBreadcrumbs(['MENU_AZURE_MARGIN','SIDEBAR_C3_SUPPORT_AZURE_MARGIN']);
    }

  getCustomers(){
    const subscription = this._azureMarginService.getCustomers().pipe(takeUntil(this.destroy$)).subscribe((response:any) =>{
      let data = response.Data; 
      const subscription1 = this._azureMarginService.getCustomerMicrosoftNonCsp().pipe(takeUntil(this.destroy$)).subscribe((response:any) =>{
        //var data1 = response.Data;
            if(response.Data){
          response.Data.forEach((value: any) => {
            data.push(value);
          });
        }
        from(data).pipe(
              distinctUntilChanged((prev:any, curr) => prev.C3Id === curr.C3Id),
              map((x:any) => x)
        ).pipe(takeUntil(this.destroy$)).subscribe(uniqueCustomer => {
          this.customers.push(uniqueCustomer); 
           if (this.customers.length > 0) {
      this.azureForm.patchValue({
        selectedCustomer: this.customers[0].C3Id // Assuming C3Id is the unique identifier
        
      });
      this._subscriptionArray.push(subscription1);
    }
        });
        this.getTenants()
      })
    })
    this._subscriptionArray.push(subscription);
  }

  getTenants(){
    const paramsId = this.azureForm.value.selectedCustomer;
    if(paramsId){
            const subscription = this._azureMarginService.getTenants(paramsId).pipe(takeUntil(this.destroy$)).subscribe((response:any) =>
            {
        this.allTenants = response.Data;
        //console.log(this.allTenants)
              const subscription1 = this._azureMarginService.getTenantsMicrosoftNonCsp(paramsId).pipe(takeUntil(this.destroy$)).subscribe((response:any) =>
                {
                  if(response.Data){
            response.Data.forEach((value: any) => {
              this.allTenants.push(value);
            });
            this._subscriptionArray.push(subscription1);
          }
          this.allTenants = orderBy(this.allTenants, ['CustomerName'], ['desc']);

          this.Tenants = JSON.parse(JSON.stringify(this.allTenants));

          if (this.Tenants !== undefined && this.Tenants !== null) {
            this.providerTenantsCount = this.Tenants.length;
            this.azureForm.patchValue({
              selectedTenent: this.Tenants[0].CustomerRefId // Automatically select the first tenant
            });
          }
          //vm.selectedServiceProviderCustomer = vm.Tenants[0];
          this.getAzureSubscriptions();

        })
      })
      this._subscriptionArray.push(subscription);
    }
  }

      getAzureSubscriptions(){
        this.currentC3CustomerId = this.customers.filter((e:any) => e.C3Id == this.azureForm.value.selectedCustomer)
        this.selectedServiceProviderCustomer = this.Tenants.filter((e:any) => e.CustomerRefId == this.azureForm.value.selectedTenent)
        if(this.currentC3CustomerId !== null && this.selectedServiceProviderCustomer !== null){
      const CustomerId = this.selectedServiceProviderCustomer[0].CustomerId;
      const ProviderCustomerId = this.selectedServiceProviderCustomer[0].ServiceProviderCustomerId;
          const subscription = this._azureMarginService.getAzureSubscriptions(CustomerId,ProviderCustomerId).pipe(takeUntil(this.destroy$)).subscribe((response:any)=>{
            if(response.Data !== null){
          this.subscriptionDataSource = response.Data;
          this.allSubscriptions = response.Data;
          this.currentSubscription = this.subscriptionDataSource.find(each => each.ParentProductId === null);
          this.currentSubscriptionId = this.currentSubscription[0].SubscriptionId;
          this.customerId = response.Data.length > 0 ? this.allSubscriptions[0].InternalCustomerId : "";
          if (this.currentSubscriptionId !== null && this.currentSubscriptionId !== '') {
            this.subscriptionCategories = this.allSubscriptions
              .filter(subscription => subscription.SubscriptionId === this.currentSubscriptionId)
              .map(subscription => subscription.CategoryId);
          } else {
            //this.subscriptionCategories = uniq(this.allSubscriptions.map(subscription => subscription.CategoryId)).join(",");
          }

        }
      })
      this._subscriptionArray.push(subscription);
    }

  }

      getBillingPeriods(){
        const subscription = this._commonService.getBillingPeriodsForSubscription().pipe(takeUntil(this.destroy$)).subscribe((response:any) =>
        {
      this.billingPeriods = response.Data;
      this.billingPeriods.reverse();
       this.azureForm.patchValue({
        startPeriod: this.billingPeriods[0] // Automatically select the first billing period
      });
          const lastBillingPeriod = this.billingPeriods.reduce((max:any, billingPeriod:any) => 
        billingPeriod.BillingPeriodId > max.BillingPeriodId ? billingPeriod : max,
        this.billingPeriods[0]
      );
      this.billingStartPeriodId = lastBillingPeriod.BillingPeriodId;
      this.billingEndPeriodId = lastBillingPeriod.BillingPeriodId;
          const topBillingPeriod = this.billingPeriods.reduce((max:any, billingPeriod:any) => 
        billingPeriod.BillingPeriodId > max.BillingPeriodId ? billingPeriod : max,
        this.billingPeriods[0]
      );

      const now = new Date();
      if (new Date(topBillingPeriod.BillingStartDate) < now && new Date(topBillingPeriod.BillingEndDate) > now) {
            this.billingPeriods.forEach((billingPeriod:any) => {
          if (new Date(billingPeriod.BillingEndDate) > now) {
            billingPeriod.BillingEndDate = now;
          }
        });
      }
      if (this.billingPeriods.length > 0) {
        this.updateAzureForm.patchValue({
          startPeriod: this.billingPeriods[0] ,
          endPeriod:this.billingPeriods[0]
        });
      }
    })
    this._subscriptionArray.push(subscription);
  }

  updateMargin() {
    if (this.updateAzureForm.valid && this.azureForm.valid) {

      const {
        Reason,
        NewMarkup,
        billingStartPeriodId,
        billingEndPeriodId,
        azureBilling
      } = this.updateAzureForm.controls;

      const {
        selectedCustomer,
        selectedTenent,
        selectedSub
      } = this.azureForm.controls;

      // Helper function to find a billing period by ID
      const findBillingPeriod = (id: number) =>
        this.billingPeriods.find(period => period.BillingPeriodId === id);

      // Find the start and end billing periods
      const startBillingPeriod = findBillingPeriod(billingStartPeriodId.value);
      const endBillingPeriod = findBillingPeriod(billingEndPeriodId.value);

      // Handle the case where the billing periods might not be found
      const startDate = startBillingPeriod ? startBillingPeriod.BillingStartDate : null;
      const endDate = endBillingPeriod ? endBillingPeriod.BillingEndDate : null;

      const reqBody = {
        CustomerId: this.customerId,
        Reason: Reason.value,
        NewMarkup: NewMarkup.value,
        StartBillingPeriodId: billingStartPeriodId.value,
        EndBillingPeriodId: billingEndPeriodId.value,
        StartDate: startDate,
        EndDate: endDate,
        CustomerC3Id: selectedCustomer.value,
        TenantId: selectedTenent.value,
        ProviderProductId: selectedSub.value,
        AzureBilling: azureBilling.value,
        AzureEstimate: true
      };

      if (reqBody.NewMarkup !== undefined && reqBody.NewMarkup > 0) {
        const subscription = this._azureMarginService.updateAzureMargin(this.currentSubscriptionId, reqBody).pipe(takeUntil(this.destroy$)).subscribe(
          (res) => {
            this._toastService.success(this._translateService.instant('TRANSLATE.AZURE_MARKUP_UPDATED_SUCCESSFULLY_SUBMITTED_TEXT'))
          }
        )
        this._subscriptionArray.push(subscription);
      }
    }


  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
