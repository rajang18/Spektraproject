import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { CommonService } from 'src/app/services/common.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core'; 
import { BillingCycles, CurrencyConversionOptions, CurrencyData, ProviderCategories, SupportedMarketData, TermDuration } from 'src/app/shared/models/common';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { WebhookNotificationService } from '../services/webhook-notification-service.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from '../../standalones/c3-table/c3-table-utils';
import { NgbActiveModal, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { C3TableComponent } from '../../standalones/c3-table/c3-table.component';
import { TranslationModule } from '../../i18n/translation.module';
import _ from 'lodash'; 
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { takeUntil } from 'rxjs';
@Component({
  standalone: true,
  imports: [CommonModule,
    TranslateModule,
    C3TableComponent,
    FormsModule,
    NgbTooltipModule,
    ReactiveFormsModule,
    TranslationModule,
    C3CommonModule,
  ],
  selector: 'app-webhook-entities-popup',
  templateUrl: './webhook-entities-popup.component.html',
  styleUrl: './webhook-entities-popup.component.scss',
})
export class WebhookEntitiesPopupComponent extends C3BaseComponent implements OnInit {

  datatableConfig: ADTSettings;
  providers: any = [];
  Categories: any = [];
  supportedCurrenciesData: CurrencyData[] = [];
  currencyOptions: CurrencyConversionOptions[] = [];
  planBillingCycles: BillingCycles[] = [];
  providerCategories: ProviderCategories[] = [];
  termDuration: TermDuration[] = [];
  consumptionTypes: any[] = [];
  supportedMarketData: SupportedMarketData[] = [];
  productList: any = null;
  webhookNotificationId = 0;
  EventEntity: any = null;
  webhookNotificationDetails: any = null;
  filterByName: string = '';
  @Input() WebhookNotificationDetailsData: any;
  @Output() sendResultData: EventEmitter<any> = new EventEmitter();
  @ViewChild('productName') productName: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('radioButton') radioButton: TemplateRef<any>;
  FilteredCategories: any = [];
  isselect: 'is selected';
  selectedProductId: any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();


  constructor(
    private webhookNotificationService: WebhookNotificationService,
    private commonService: CommonService,
    private translateService: TranslateService,
    private _cdRef: ChangeDetectorRef,
    public _router: Router,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _ngbactiveModal: NgbActiveModal,
    private _modalService: NgbModal,
    private toastService: ToastService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
  }

  ngOnInit(): void {
    this.HasPermission();
    this.webhookNotificationDetails = this.WebhookNotificationDetailsData;
    this.selectedProductList = this.WebhookNotificationDetailsData.selectedProductList || null;
    this.selectedProductId = this.selectedProductList.ProductId || null;
    this.getProviders();
    this.getCategories();
    if (this.Permissions.HasParterTrailOffer == "Allowed") {
      this.getProductTrialDurations();
    }
    this.getProductTermDurations();
    this.GetBillingCycles();
    this.GetConsumptionTypes();
    if (this.Permissions.HasParterTrailOffer == "Allowed") {
      this.getTrialPeriodDays();
    }
    this.handleTableConfig();
    this.isselect = 'is selected';

    if (this.webhookNotificationDetails != null && this.webhookNotificationDetails != '') {
      this.EventId = this.webhookNotificationDetails.EventId;
      this.EventEntityId = this.webhookNotificationDetails.EventEntityId;
      this.webhookNotificationId = this.webhookNotificationDetails.WebhooknotificationMessageId;
      this.EventEntity = this.EventId + '_' + this.EventEntityId;
    }

  }

  WebhookNotificationMessageId: number = 0;
  EventId: any = null;
  EventEntityId: any = null;
  ProductName: any = null;
  ProviderIds: any = null;
  CategoryIds: any = null;
  BillingCycleIds: any = "";
  ProviderCategories: any = null;
  ConsumptionTypes: any = null;
  Validities: any = "";
  ValidityTypes: any = "";
  SupportedMarket: any = null;
  EntityName: any = null;
  RecordId: any = null;
  IsTrailOffer: boolean = false;
  TrialDuration: any = "";
  providerName: any = null;
  categoryName: any = null;
  category: any = null;
  productListData: any[] = [];
  selectedProductList: any = [];
  ProductTrialDurations: any = [];
  ProductTermDurations: any = [];
  BillingCycle: any = [];
  ConsumptionType: any = [];
  ProviderSelection: any = [];
  FilteredProviderCategories: any = [];
  ProviderCategorySelection: any = [];
  SelectedProviderCategories: any = [];
  SelectedProvider: any = [];
  CategorySelection: any = [];
  SelectedCategory: any = [];
  TermDurationSelection: any = [];
  SelectedValidities: any = [];
  SelectedValidityTypes: any = [];
  BillingCycleSelection: any = [];
  SelectedBillingCycles: any = [];
  ConsumptionTypeSelection: any = [];
  SelectedConsumptionTypesToFilter: any = [];
  isLoading: boolean = true;
  SelectedIsTrailOffer: any = false;
  SelectedProviderForTrail: any = [];
  SelectedTrialDuration: any = [];
  TrialDurationSelection: any = [];
  trialDays: any;
  IsManagedByPartner: any = false;
  noDataFound = true;

  handleTableConfig() {
    this.datatableConfig = null;
    // this.isLoading=false;
    setTimeout(() => {
      const self = this;
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        scrollCollapse: true,
        scrollY: '500px',
        ordering: false,
        ajax: (dataTablesParameters: any, callback: any) => {
          const { Name, StartInd, SortColumn, SortOrder, PageSize, length } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          this.noDataFound = true;
          let nameFilter = Name;
          if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
            nameFilter = this.filterByName
          }
          const subscription = this.webhookNotificationService.getData({
            WebhookNotificationMessageId: this.webhookNotificationId,
            EventId: this.EventId,
            EventEntityId: this.webhookNotificationDetails.EventEntityId,
            ProductName: nameFilter,
            ProviderIds: this.SelectedProvider ? this.SelectedProvider.join() : null,
            CategoryIds: this.SelectedCategory ? this.SelectedCategory.join() : null,
            BillingCycleIds: this.SelectedBillingCycles ? this.SelectedBillingCycles.join() : null,
            ProviderCategories: this.SelectedProviderCategories ? this.SelectedProviderCategories.join() : null,
            ConsumptionTypes: this.SelectedConsumptionTypesToFilter ? this.SelectedConsumptionTypesToFilter.join() : null,
            Validities: this.SelectedValidities && this.SelectedValidities.length > 0 ? this.SelectedValidities.join() : this.TermDurationSelection.map((e: any) => e.Validity).join(),
            ValidityTypes: this.SelectedValidityTypes && this.SelectedValidityTypes.length > 0 ? this.SelectedValidityTypes.join() : this.TermDurationSelection.map((e: any) => e.ValidityType).join(),
            SupportedMarket: this.SupportedMarket,
            EntityName: this.commonService.entityName,
            RecordId: this.commonService.recordId,
            PageCount: PageSize,
            PageIndex: (StartInd - 1) * PageSize,
            IsTrailOffer: this.SelectedIsTrailOffer,
            TrialDuration: this.SelectedTrialDuration && this.SelectedTrialDuration.length > 0 ? this.SelectedTrialDuration.join() : this.TrialDurationSelection.map((e: any) => 'Days').join(),
          }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
            this.noDataFound = false;
            const recordsTotal = Data[0].TotalElementsCount;
            callback({
              data: Data,
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });
          this._subscriptionArray.push(subscription);
        },
        order: [1, 'asc'],
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
            orderable: false,
          },
          {
            className: 'col-md-5 text-start',
            title: this.translateService.instant('TRANSLATE.TAGGED_ENTITY_ELEMENT_PRODUCT_NAME_HEADER'),
            //data: 'ProductName',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.productName,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
          },
          {
            orderable: false,
            className: 'col-md-6 text-start',
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
      this._cdRef.detectChanges();
    });

  }

  Permissions = {
    HasParterTrailOffer: "Denied",
  }

  HasPermission() {
    this.Permissions.HasParterTrailOffer = this._permissionService.hasPermission(this.cloudHubConstants.GET_PARTNER_TRIAL_OFFER);
  }

  updateSelectedList(item: any) {
    this.selectedProductList = null
    item.IsSelected = 'true';
    if (item.IsSelected == 'true') {
      this.selectedProductList = item;
    }
  }

  Submit() {
    let resultData = this.webhookNotificationDetails;
    if (this.selectedProductList != null) {
      resultData.RecordId = this.selectedProductList.ProductId;
      resultData.selectedProductList = this.selectedProductList;
      localStorage.setItem('WebhookNotification_' + this.EventEntity, JSON.stringify(this.selectedProductList))
    }
    if (resultData.RecordId !== undefined && resultData.RecordId !== null && resultData.RecordId) {
      this.toastService.success(this.translateService.instant('TRANSLATE.WEBHOOK_NOTIFICATION_SUCCESS_MESSAGE_FOR_PRODUCT_SELECT'));
    }
    else {
      this.toastService.success(this.translateService.instant('TRANSLATE.WEBHOOK_NOTIFICATION_WARNING_MESSAGE_WHILE_PRODUCT_SELECT'));
    }
    this._ngbactiveModal.close(resultData);
  }
  closeModal() {
    this._modalService.dismissAll();
  }

  getProviders() {
    const subscription = this.webhookNotificationService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.providers = Data;
      this._cdRef.detectChanges();
    });
    this._subscriptionArray.push(subscription);
  }



  getCategories() {
    const subscription = this.webhookNotificationService.getCategories().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.Categories = Data;
      this._cdRef.detectChanges();
      this.FilterCategories()
    });
    this._subscriptionArray.push(subscription);
  }


  FilterCategories() {
    this.FilteredCategories = this.Categories?.filter((category: any) => {
      return this.ProviderSelection.findIndex((provider: any) => provider.ID === category.ProviderId) > -1;
    });
    //Reset values in selection
    this.CategorySelection = this.CategorySelection?.filter((category: any) => {
      return this.FilteredCategories.findIndex((each: any) => each.ID === category.ID) > -1;
    });
    //Reset trial offer category selection
    var partnerSelected = this.ProviderSelection.filter((provider: any) => {
      return provider.Name === 'Partner'
    });
    if (partnerSelected.length === 0) {
      this.SelectedIsTrailOffer = false;
    }
    this.SelectedCategory = this.CategorySelection.map((e: any) => 'ID');
    //this._cdRef.detectChanges();
  }

  getProductTrialDurations() {
    const subscription = this.webhookNotificationService.getProductTrialDurations().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.ProductTrialDurations = Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  getProductTermDurations() {
    const subscription = this.webhookNotificationService.getProductTermDurations().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.ProductTermDurations = Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  GetBillingCycles() {
    const subscription = this.webhookNotificationService.GetBillingCycles().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.BillingCycle = Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  GetConsumptionTypes() {
    const subscription = this.webhookNotificationService.GetConsumptionTypes().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.ConsumptionType = Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  }

  toggleProviderSelection(provider: any) {
    var idx = this.ProviderSelection.indexOf(provider);
    // Is currently selected
    if (idx > -1) {
      this.ProviderSelection.splice(idx, 1);
      this.IsManagedByPartner = !this.IsManagedByPartner;
    }
    else {  // Is newly selected
      this.ProviderSelection.push(provider);
      this.IsManagedByPartner = !this.IsManagedByPartner;
    }
    this.SelectedProviderForTrail = this.ProviderSelection?.filter((row: any) => {
      return row.Name == 'Partner';
    });

    this.FilterCategories();
    this.FilterProviderCategories();
    this.FilterProductsByProvider();
  };
  FilterProviderCategories() {
    this.FilteredProviderCategories = this.ProviderCategories?.filter((category: any) => {
      return this.ProviderSelection.findIndex((provider: any) => provider.ID === category.ProviderId) > -1;
    });

    //Reset values in selection
    this.ProviderCategorySelection = this.ProviderCategorySelection?.filter((category: any) => {
      return this.FilteredProviderCategories.findIndex((each: any) => each.ID === category.ID) > -1;
    });

    this.SelectedProviderCategories = this.ProviderCategorySelection.map((e: any) => e.ProviderCategoryName);
  }

  FilterProductsByProvider() {
    this.SelectedProvider = [];
    this.SelectedProvider = this.ProviderSelection.map((e: any) => e.ID);
    //this.handleTableConfig();
    this.reloadEvent.emit(true);
  }

  toggleCategorySelection(category: any) {
    var idx = this.CategorySelection.indexOf(category);
    // Is currently selected
    if (idx > -1) {
      this.CategorySelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.CategorySelection.push(category);
    }

    this.FilterProductsByCategory();
  };

  FilterProductsByCategory() {
    this.SelectedCategory = [];
    this.SelectedCategory = this.CategorySelection.map((e: any) => e.ID);
    //this.handleTableConfig();
    this.reloadEvent.emit(true);
  }

  toggleTermDurationSelection(term: any) {
    var idx = this.TermDurationSelection.indexOf(term);
    // Is currently selected
    if (idx > -1) {
      this.TermDurationSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.TermDurationSelection.push(term);
    }

    this.FilterProductsByTermDuration();
  };

  FilterProductsByTermDuration() {
    this.SelectedValidities = [];
    this.SelectedValidityTypes = [];
    this.SelectedValidities = this.TermDurationSelection.map((e: any) => e.Validity);
    this.SelectedValidityTypes = this.TermDurationSelection.map((e: any) => e.ValidityType);
    this.reloadEvent.emit(true);
    // this.isLoading=true;
    // this.handleTableConfig()
    // this._cdRef.detectChanges();
  }

  toggleBillingCycleSelection(billingCycle: any) {
    var idx = this.BillingCycleSelection.indexOf(billingCycle);
    // Is currently selected
    if (idx > -1) {
      this.BillingCycleSelection.splice(idx, 1);
    }
    else {  // Is newly selected
      this.BillingCycleSelection.push(billingCycle);
    }

    this.FilterProductsByBillingCycle();
  };

  FilterProductsByBillingCycle() {
    this.SelectedBillingCycles = [];
    this.SelectedBillingCycles = this.BillingCycleSelection.map((e: any) => e.ID);
    //this.handleTableConfig();
    this.reloadEvent.emit(true);
  }

  toggleConsumptionTypeSelection(consumptionType: any) {
    var idx = this.ConsumptionTypeSelection.indexOf(consumptionType);
    // Is currently selected
    if (idx > -1) {
      this.ConsumptionTypeSelection.splice(idx, 1);
    } else { // Is newly selected
      this.ConsumptionTypeSelection.push(consumptionType);
    }

    this.FilterProductsByConsumptionType();
  };

  FilterProductsByConsumptionType() {
    this.SelectedConsumptionTypesToFilter = [];
    this.SelectedConsumptionTypesToFilter = this.ConsumptionTypeSelection.map((e: any) => e.ID);
    //this.handleTableConfig();
    this.reloadEvent.emit(true);
  }

  FilterProductsByIsTrailOffer() {
    if (!this.SelectedIsTrailOffer) {
      this.SelectedTrialDuration = [];
      this.TrialDurationSelection = [];
    }
    this.SelectedIsTrailOffer = !this.SelectedIsTrailOffer;
    //this.getTrialPeriodDays();
    //this.handleTableConfig();
    this.reloadEvent.emit(true);
  }


  getTrialPeriodDays() {
    const subscription = this.webhookNotificationService.getTrialPeriodDays().pipe(takeUntil(this.destroy$)).subscribe((Data: any) => {
      this.trialDays = Data.Data;
      this._cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
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
    // this.handleTableConfig();
    this.reloadEvent.emit(true);
  }

  ReloadTableData() {
    // this.handleTableConfig();
    this.reloadEvent.emit(true);
  }

  onCaptureEvent(event: Event) { }
  enableEditField(data: any) { }

  onOnDestroy(){
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}

