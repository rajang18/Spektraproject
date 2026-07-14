import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core'; 
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { PermissionService } from 'src/app/services/permission.service'; 
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CustomNotificationService } from '../../../services/custom-notification-service.service';
import { combineLatest } from 'rxjs';
import { BillingTypes, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import _, { orderBy } from 'lodash';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Select2Data, Select2Value } from 'ng-select2-component';
import { DataTableDirective } from 'angular-datatables';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'app-tagged-entities-details',
  templateUrl: './tagged-entities-details.component.html',
  styleUrl: './tagged-entities-details.component.scss'
})
export class TaggedEntitiesDetailsComponent extends C3BaseComponent implements OnInit {
  datatableConfig: ADTSettings;
  entityName: string;
  recordId: string;
  termDuration: TermDuration[] = [];
  consumptionTypes: any[] = [];
  providers: any[] = [];
  billingCycles: any[] = [];
  providerCategories: any[] = [];
  categories: any[] = [];
  billingTypes: BillingTypes[] = [];
  filteredCategories: any[] = [];
  providerSelection: any[] = [];
  categorySelection: any[] = [];
  selectedCategory: any[] = [];
  filteredProviderCategories: any[] = [];
  providerCategorySelection: any[] = [];
  termDurationSelection: any[] = [];
  billingCycleSelection: any[] = [];
  billingTypeSelection: any[] = [];
  selectedBillingTypes: any[] = [];
  consumptionTypeSelection: any[] = [];
  selectedProviderCategories: any[] = [];
  selectedProvider: any[] = [];
  selectedValidities: any[] = [];
  selectedValidityTypes: any[] = [];
  selectedBillingCycles: any[] = [];
  selectedConsumptionTypesToFilter: any[] = [];
  lazyLoadedProducts: any[] = [];
  selectedProducts: any[] = [];
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('radioButton') radioButton: TemplateRef<any>;
  ProductTermDurations: any;
  @Input() eventId: any;
  @Input() selectedEntitiesName: any;
  @Input() EventEntityId: any;
  @Input() notificationMessageId:any
  selectedPlanId: any[] = [];
  plans: any[] = [];
  partnerSelected: any;
  trialDays: any;
  selectedPlanNameDataSet: Select2Data = [];
  selectedPlanNameValueDetailsDataSet: Select2Value[] = [];
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @Input() isEditMode: boolean;
  SelectedIsTrailOffer: boolean = false;
  SelectedTrialDuration: any[] = [];
  TrialDurationSelection: any[] = [];
  supportedMarket: SupportedMarketData[] = [];
  marketCodeSelection: any[] = [];
  selectedMarketTypesToFilter: any[] = [];
  selectedProductIds: any;
  customnotificationEventDetails: any = {};
  @ViewChild(DataTableDirective, { static: true })
  private _datatableElement: DataTableDirective;
  EntiyName: string;
  selectedProductList:any[] = [];
  productListData:any; 
  productIdCsv:any;
  @Input() ElementSetId:any;
  @Input() pageMode:any;
  form:FormGroup;





  constructor(
    private _customNotificationService: CustomNotificationService, 
    private cdRef: ChangeDetectorRef,
    private translateService: TranslateService,
    private _commonService: CommonService,
    public _router: Router,
    private activemodal: NgbActiveModal,
    private _unsavedChangesService: UnsavedChangesService, 
    private _formBuilder: FormBuilder,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.entityName = this._commonService.entityName;
    this.recordId = this._commonService.recordId;
    this.form = this._formBuilder.group({
      selectedIds:['']    })
  }
  ngOnInit(): void {
    this.HasPermission();
    if (this.Permissions.HasParterTrailOffer == "Allowed") {
      this.getTrialPeriodDays();
    }
    this.getplans();
    this.handleTableConfig();
    this._subscription = combineLatest([
      this._commonService.getProviders(),
      this._commonService.getBillingCycles(),
      //this._commonService.getCategories('addplan'),
      this._commonService.getProviderCategories(),
      this._commonService.getCategoriesForSubscription(),
      this._commonService.getTermDuration(),
      this._commonService.getConsumptionTypes(),
      this._commonService.getBillingTypes(),
      //this._commonService.getSupportedCurrencies(),
      this._commonService.getSupportedMarkets(),
    ])
      // .subscribe(([providers, planBillingCycles,
      //    providerCategories, termDuration, categories, consumptionTypes,
      //    billingTypes, supportedMarket]) => {
      //   //this._commonService.getSupportedCurrencies(),
      // ])
      .subscribe(([providers, planBillingCycles,
        providerCategories, categories, termDuration, consumptionTypes,
        billingTypes, supportedMarket]: any) => {
        // let providerData: any = providers;
        this.providers = providers;
        this.billingCycles = planBillingCycles;
        this.providerCategories = providerCategories.Data.filter((each: any) => each.ProviderCategoryName);
        this.categories = categories.Data;
        this.termDuration = termDuration;
        this.consumptionTypes = consumptionTypes;
        this.billingTypes = billingTypes;
        this.supportedMarket = supportedMarket.Data;
        this.cdRef.detectChanges();
      });

      if(this.isEditMode){
        this.form.get('selectedIds').disable()
        }
  }

  Permissions = {
    HasParterTrailOffer: "Denied",
  }

  HasPermission() {
    this.Permissions.HasParterTrailOffer = this._permissionService.hasPermission(this.cloudHubConstants.GET_PARTNER_TRIAL_OFFER);
  }

  getTrialPeriodDays() {
    this._subscription = this._customNotificationService.getTrialPeriodDays().subscribe((response: any) => {
      this.trialDays = response.Data;
    })
  }


  toggleTrialDurationSelection(days: any) {
    var idx = this.TrialDurationSelection.indexOf(days);
    // Is currently selected
    if (idx > -1) {
      this.TrialDurationSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.TrialDurationSelection.push(days);
    }

    this.filterProductsByTrialDuration();
  };

  filterProductsByTrialDuration() {
    this.SelectedTrialDuration = [];
    this.SelectedTrialDuration = _.map(this.TrialDurationSelection, 'Days');
    this.filterProducts();
  }
  toggleProviderSelection(provider: any) {
    let idx = this.providerSelection.indexOf(provider);
    // Is currently selected
    if (idx > -1) {
      this.providerSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.providerSelection.push(provider);
    }
    this.filterCategories();
    this.filterProviderCategories();
    this.filterProductsByProvider();
  };

  toggleCategorySelection(category: any) {
    let idx = this.categorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.categorySelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.categorySelection.push(category);
    }

    this.filterProductsByCategory();
  };

  filterProviderCategories() {
    this.filteredProviderCategories = this.providerCategories.filter(category => {
      return this.providerSelection.findIndex(provider => provider.ID === category.ProviderId) > -1;
    });

    //Reset values in selection
    this.providerCategorySelection = this.providerCategorySelection.filter(category => {
      return this.filteredProviderCategories.findIndex(each => each.ID === category.ID) > -1;
    });

    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    this.cdRef.detectChanges();
  }

  toggleProviderCategorySelection(providerCategory: any) {

    let idx = this.providerCategorySelection.indexOf(providerCategory);
    // Is currently selected
    if (idx > -1) {
      this.providerCategorySelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.providerCategorySelection.push(providerCategory);
    }

    this.filterProductsByProviderCategory();
  };

  toggleTermDurationSelection(term: any) {
    let idx = this.termDurationSelection.indexOf(term);
    // Is currently selected
    if (idx > -1) {
      this.termDurationSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.termDurationSelection.push(term);
    }

    this.filterProductsByTermDuration();
  };


  toggleBillingCycleSelection(billingCycle: any) {

    let idx = this.billingCycleSelection.indexOf(billingCycle);
    // Is currently selected
    if (idx > -1) {
      this.billingCycleSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.billingCycleSelection.push(billingCycle);
    }

    this.filterProductsByBillingCycle();
  };

  toggleBillingTypeSelection(billingType: any) {

    let idx = this.billingTypeSelection.indexOf(billingType);
    // Is currently selected
    if (idx > -1) {
      this.billingTypeSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.billingTypeSelection.push(billingType);
    }

    this.filterProductsByBillingType();
  };

  toggleConsumptionTypeSelection(consumptionType: any) {

    let idx = this.consumptionTypeSelection.indexOf(consumptionType);
    // Is currently selected
    if (idx > -1) {
      this.consumptionTypeSelection.splice(idx, 1);
    } else { // Is newly selected
      this.consumptionTypeSelection.push(consumptionType);
    }

    this.filterProductsByConsumptionType();
  };

  toggleMarketTypeSelection(marketCode: any) {
    var idx = this.marketCodeSelection.indexOf(marketCode);
    if (idx > -1) {
      this.marketCodeSelection.splice(idx, 1);
    } else {
      this.marketCodeSelection.push(marketCode)
    }
    this.filterProductsBySupportedMarket();
  }
  filterProductsBySupportedMarket() {
    this.selectedMarketTypesToFilter = [];
    this.selectedMarketTypesToFilter = _.map(this.marketCodeSelection, 'ID');
    this.filterProducts();
  }

  //Sets this.FilteredCategories to categories for a providerID
  filterCategories() {
    this.filteredCategories = this.categories.filter(category => {
      return this.providerSelection.findIndex(provider => provider.ID === category.ProviderId) > -1;
    });
    //Reset values in selection
    this.categorySelection = this.categorySelection.filter(category => {
      return this.filteredCategories.findIndex(each => each.ID === category.ID) > -1;
    });

    //Reset trial offer category selection
    this.partnerSelected = this.providerSelection.filter(provider => {
      return provider.Name === 'Partner'
    });

    this.selectedCategory = _.map(this.categorySelection, 'ID');
    this.cdRef.detectChanges();
  }

  //Filter products by provider category
  filterProductsByProviderCategory() {
    this.selectedProviderCategories = [];
    this.selectedProviderCategories = _.map(this.providerCategorySelection, 'ProviderCategoryName');
    this.filterProducts();
  }

  //Filter products by provider
  filterProductsByProvider() {
    this.selectedProvider = [];
    this.selectedProvider = _.map(this.providerSelection, 'ID');
    this.filterProducts();
  }

  //Filter products by category
  filterProductsByCategory() {
    this.selectedCategory = [];
    this.selectedCategory = _.map(this.categorySelection, 'ID');
    this.filterProducts();
  }

  //Filter products by term duration
  filterProductsByTermDuration() {
    this.selectedValidities = [];
    this.selectedValidityTypes = [];
    this.selectedValidities = _.map(this.termDurationSelection, 'Validity');
    this.selectedValidityTypes = _.map(this.termDurationSelection, 'ValidityType');
    this.filterProducts();
  }

  //Filter products by billing cycle
  filterProductsByBillingCycle() {
    this.selectedBillingCycles = [];
    this.selectedBillingCycles = _.map(this.billingCycleSelection, 'ID');
    this.filterProducts();
  }

  //Filter products by billing type
  filterProductsByBillingType() {
    this.selectedBillingTypes = [];
    this.selectedBillingTypes = _.map(this.billingTypeSelection, 'Id');
    this.filterProducts();
  }

  filterProductsByConsumptionType() {
    this.selectedConsumptionTypesToFilter = [];
    this.selectedConsumptionTypesToFilter = _.map(this.consumptionTypeSelection, 'ID');
    this.filterProducts();
  }

  filterProductsByIsTrailOffer() {
    if (!this.SelectedIsTrailOffer) {
      this.SelectedTrialDuration = [];
      this.TrialDurationSelection = [];
    }
    this.SelectedIsTrailOffer = !this.SelectedIsTrailOffer;
    this.filterProducts();
  }

  //Apply filters
  filterProducts() {
    this.lazyLoadedProducts = [];
    this.reloadEvent.emit(true);
    this.cdRef.detectChanges();
  }

  handleTableConfig() {
    // this.isLoading=false;
    setTimeout(() => {
      const self = this;
      let _subscription;
      this.datatableConfig = {
        serverSide: true,
        ordering:false,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        scrollCollapse: true,
        scrollY: '500px',
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize, PlanName } =
            mapParamsWithApi(dataTablesParameters);
          _subscription && _subscription?.unsubscribe();
          _subscription = this._customNotificationService.getProducrList({
            NotificationMessageId: this.notificationMessageId? this.notificationMessageId : 0,
            EventId: this.eventId,
            EventEntityId: this.EventEntityId,
            ProductName: Name,
            PlanIds: this.selectedPlanId ? this.selectedPlanId.join() : null,
            ProviderIds: this.selectedProvider ? this.selectedProvider.join() : null,
            CategoryIds: this.selectedCategory ? this.selectedCategory.join() : null,
            BillingCycleIds: this.selectedBillingCycles ? this.selectedBillingCycles.join() : null,
            ProviderCategories: this.selectedProviderCategories ? this.selectedProviderCategories.join() : null,
            ConsumptionTypes: this.selectedConsumptionTypesToFilter ? this.selectedConsumptionTypesToFilter.join() : null,
            Validities: this.selectedValidities && this.selectedValidities.length > 0 ? this.selectedValidities.join() : this.termDurationSelection.map((e: any) => e.Validity).join(),
            ValidityTypes: this.selectedValidityTypes && this.selectedValidityTypes.length > 0 ? this.selectedValidityTypes.join() : this.termDurationSelection.map((e: any) => e.ValidityType).join(),
            SupportedMarket: (this.selectedMarketTypesToFilter !== null && this.selectedMarketTypesToFilter.length > 0) ? this.selectedMarketTypesToFilter?.join(",") : null,
            //  SupportedMarket: this.SupportedMarket,
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            IsTrailOffer: this.SelectedIsTrailOffer,
            ElementSetId: this.ElementSetId,
            PageCount: PageSize,
            PageIndex: (StartInd - 1) * PageSize,
            PlanName: PlanName,
            TrialDuration: this.SelectedTrialDuration && this.SelectedTrialDuration.length > 0 ? this.SelectedTrialDuration.join() : _.map(this.TrialDurationSelection, 'Days').join(),
          }).subscribe(({ Data }: any) => {
              const recordsTotal = Data.length> 0 ? Data[0]?.TotalElementsCount : 0;
            this.productListData = Data;
            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
            if (this.productListData.length > 0 && this.productListData[0].SelectedValueAsJSON != null) {
              if (this.selectedEntitiesName == 'PlanProduct') {
                var previouslySelectedProductArray = JSON.parse(this.productListData[0].SelectedValueAsJSON);
                previouslySelectedProductArray.forEach((product) => {
                    var existingProductCsv = product.planProductId.split(',');
                    existingProductCsv.forEach(existingProduct => {
                        this.selectedProductList.push({
                            PlanId: product.planId,
                            ProductId: parseInt(existingProduct),
                            IsSelected: 1
                        });
                        this.selectedPlanId.push(
                          product.planId
                        )
                    });
                    
                });
                // this.plans = this.plans?.map((item:any)=>{
                //   item['ID']=parseInt(item['ID']);
                //   return item
                // })
                //this.selectedPlanId.push(this.plans[0]?.ID);  
                this.form.get('selectedIds').setValue(this.selectedPlanId)           
              }
              if (this.selectedEntitiesName == 'ProductVariant') {
                  var previouslySelectedProductArray = JSON.parse(this.productListData[0].SelectedValueAsJSON);
                  var previouslySelectedProducts = previouslySelectedProductArray.ProductVariantIds.split(',');
                  previouslySelectedProducts.forEach((number) => {
                    this.selectedProductList.push({
                      ProductId: number,
                      IsSelected: 1
                    });
                  });
              }
          }

          // if (localStorage.getItem(`CustomNotification_All_${this.EventEntityId}`) !== undefined && localStorage.getItem(`CustomNotification_All_${this.EventEntityId}`) !== null && localStorage.getItem(`CustomNotification_All_${this.EventEntityId}`) !== '') {
          //   let eventEntityStorageObject = JSON.parse(localStorage.getItem(`CustomNotification_All_${this.EventEntityId}`));
          //   this.productIdCsv = _.map(eventEntityStorageObject, "ProductId");
          //   this.productListData.forEach((product) => {
          //       if (this.productIdCsv.includes(product.ProductId) == true) {
          //           product.IsSelected = true;
          //       }
          //       else {
          //           product.IsSelected = false;
          //           //logic to update if both IsSelected flag is true based on product list data and selectedproductlist
          //           var index = this.selectedProductList.indexOf(product);
          //           this.selectedProductList.splice(index, 1);
          //       }
          //   })
          //   if (eventEntityStorageObject != null && eventEntityStorageObject) {
          //       eventEntityStorageObject.forEach(function (selectedProducts) {
          //           this.selectedProductList.push(selectedProducts);
          //       })
          //   }
          // }
          // //if any duplication are present removing those duplication
          // this.selectedProductList = this.selectedProductList.filter((obj, index) => {
          //               return index === this.selectedProductList.findIndex(o => obj.ProductId == o.ProductId && obj.ProductId != 0)
          //       })

          });
        },
        columns: [
          {
            className: 'col-md-1',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.radioButton,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-4 text-break text-wrap',
            title: this.translateService.instant('TRANSLATE.TAGGED_ENTITY_ELEMENT_PLAN_NAME_HEADER'),
            data: 'PlanName',
            defaultContent: '',
            visible: this.selectedEntitiesName === 'PlanProduct',
          },
          {
            className: 'col-md-4 text-break text-wrap',
            title: this.translateService.instant('TRANSLATE.TAGGED_ENTITY_ELEMENT_PRODUCT_NAME_HEADER'),
            data: 'Name',
            defaultContent: '',
          },
          {
            className: 'col-md-4 body-alignment-normal',
            title: this.translateService.instant('TRANSLATE.TAGGED_ENTITY_ELEMENT_PROPERTIES_HEADER'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.propertiespills,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
      this.cdRef.detectChanges();
    });

  }
  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  onSelect(data: any) {
    //data.IsSelected = (!data.IsSelected)
    this.selectedProducts.unshift(data);
    let existingProduct = this.selectedProductList.find(a => a.ProductId === data.ProductId);

 
    if (data.IsSelected) {
        this.selectedProductList.push(data);
    }
    else {
       this.RemoveFromList(data);
    }
    localStorage.setItem(`CustomNotification_All_${this.EventEntityId}`, JSON.stringify(this.selectedProductList))
  }

  RemoveFromList(item) {
    var index = this.selectedProductList.indexOf(item);
    this.selectedProductList.splice(index, 1);
    this.UpdateSelectedDetailsStatus(false, item.ProductId);
  }

  UpdateSelectedDetailsStatus(status, productId) {
    _.each(this.productListData, function (a) {
        if (a.ProductId === productId) {
            a.IsSelected = status;
        }
    });
    localStorage.setItem(`CustomNotification_All_${this.EventEntityId}`, JSON.stringify(this.selectedProductList))
  }

  //  onSubmit(){
  //   this.activemodal.close(this.selectedProducts);
  //  }

  onSubmit() {
    const uniqueSelectedProduct = this.selectedProductList.filter((obj, index) => {
      return index === this.selectedProductList.findIndex(o => obj.ProductId === o.ProductId && obj.ProductId !== 0);
    });

    const resultSet = this.customnotificationEventDetails;

    if (uniqueSelectedProduct.length > 0) {
      uniqueSelectedProduct.forEach(item => { });

      if (this.selectedEntitiesName === 'ProductVariant') {
        this.selectedProductIds = _.map(uniqueSelectedProduct, 'ProductId').join(',');
        let selectedValueDetails = [];

        //Loop through each unique product to extract planId and productId
        uniqueSelectedProduct.forEach(product => {
          selectedValueDetails.push({
            ProductVariantIds: product.ProductId.toString() // Convert to string if necessary
          });
        });
        resultSet.SelectedProductDetails =  JSON.stringify({ "ProductVariantIds": this.selectedProductIds });
        resultSet.SelectedProductCount = uniqueSelectedProduct.length;
      }

      if (this.selectedEntitiesName === 'PlanProduct') {
        const result: any[] = [];
        resultSet.SelectedProductCount = uniqueSelectedProduct.length;

        uniqueSelectedProduct.forEach(item => {
          let pProducts: string | null = null;

          if (result.length > 0) {
            let prod = result.map(x => {
              if (x.planId === item.PlanId) {
                return x;
              }
            });

            prod = prod.filter(element => element !== undefined);

            if (prod && prod[0] !== undefined) {
              pProducts = `${prod[0].planProductId},${item.ProductId}`;
            }
          }

          if (pProducts === null) {
            const product = {
              planId: item.PlanId,
              planProductId: item.ProductId.toString()
            };
            result.push(product);
          } else {
            const product = {
              planId: item.PlanId,
              planProductId: pProducts
            };

            result.forEach(x => {
              if (x.planId === item.PlanId) {
                x.planProductId = product.planProductId;
              }
            });
          }
        });

        resultSet.SelectedProductDetails = JSON.stringify(result);
        resultSet.SelectedPlanCount = result.length;
      }

      this.activemodal.close(resultSet);
    } else {
      if (this.selectedEntitiesName === 'ProductVariant') {
        resultSet.SelectedProductCount = this.productListData[0].OriginalProductCount;
        resultSet.SelectedProductDetails = JSON.stringify({ ProductVariantIds: '0' });
      }

      if (this.selectedEntitiesName === 'PlanProduct') {
        const result: any[] = [];

        if (this.selectedPlanId.length > 0) {
          this.selectedPlanId.forEach(plan => {
            const product = {
              planId: plan.ID,
              planProductId: '0'
            };
            result.push(product);
          });

          resultSet.SelectedProductDetails = JSON.stringify(result);
          resultSet.SelectedPlanCount = this.selectedPlanId.length;
          resultSet.SelectedProductCount = this.productListData[0].OriginalProductCount;
          localStorage.setItem(`CustomNotification_All_${this.EventEntityId}`, JSON.stringify(this.selectedPlanId));
        } else {
          const product = {
            planId: 0,
            planProductId: '0'
          };
          result.push(product);

          resultSet.SelectedProductDetails = JSON.stringify(result);
          resultSet.SelectedProductCount = this.productListData[0].OriginalProductCount;
          resultSet.SelectedPlanCount = 0;
          localStorage.setItem(`CustomNotification_All_${this.EventEntityId}`, JSON.stringify(this.selectedPlanId));
        }
      }

      this.activemodal.close(resultSet);
    }
  }

  getplans() {
    this._subscription = this._customNotificationService.getPlans().subscribe((response: any) => {
      this.plans = response.Data;
      this.plans = orderBy(this.plans, ['Name'], ['asc']);
      this.setPlanDataDataSet();
      this.cdRef.detectChanges();
    })
  }

  setPlanDataDataSet() {
    this.plans.forEach(v => {
      this.selectedPlanNameDataSet.push({
        value: v.ID,
        label: null,
        //disabled:this.isEditMode,
        data: { value: v.Name, text: v.ID }
      })
      // if(this.scheduledReportRecipientDetails && this.scheduledReportRecipientDetails.Recipients == v.TagValue ){
      //   this.selectedroleValueDetailsDataSet.push(v.TagValue);
      // }
    });
    this.cdRef.detectChanges();
  }

  onplanChange(event: any) {
    this.selectedPlanId = event;
    this.reloadEvent.emit(true);
  }

  closeModal() {
    this.activemodal.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this._unsavedChangesService.setUnsavedChanges(false);

  }
}
