import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ProductMappingService } from '../services/productmapping.service';
import { PurchaseProductMappingCustomerNamePopUPComponent } from 'src/app/modules/standalones/product-mapping-popups/purchase-product-mapping-customer-name-pop-up/purchase-product-mapping-customer-name-pop-up.component';
import { PurchaseProductMappingPSACustomerPopupComponent } from 'src/app/modules/standalones/product-mapping-popups/purchase-product-mapping-psa-customer-popup/purchase-product-mapping-psa-customer-popup.component';
import { PurchasedProductMappingModel } from '../Models/purchasedProductMappingModel';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { PurchaseProductMappingContractPopupComponent } from 'src/app/modules/standalones/product-mapping-popups/purchase-product-mapping-contract-popup/purchase-product-mapping-contract-popup.component';
import _ from 'lodash';
import { PurchaseProductMappingProductsPopupComponent } from 'src/app/modules/standalones/product-mapping-popups/purchase-product-mapping-products-popup/purchase-product-mapping-products-popup.component';
import { ToastService } from 'src/app/services/toast.service';
import { Subject, takeUntil} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { ThemeModeService } from 'src/app/_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';


@Component({
  selector: 'app-purchasedproductmapping',
  templateUrl: './purchasedproductmapping.component.html',
  styleUrl: './purchasedproductmapping.component.scss'
})
export class PurchasedproductmappingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  providerName: string;
  providerDetails: any[];
  purchasedProductMappingForm: FormGroup;
  ServiceProviderCustomers: any[];
  CustomerConsentModel: any = [];
  specialQualificationDetails: any = [];
  categories: any = [];
  isGridDataLoading: boolean = false;
  cpvApplicationID: string = '';
  reservedInstancesCategory = false;
  currentIndex: any = null;
  CustomerName: any = null;
  purchasedProductMapping = new PurchasedProductMappingModel();
  existingMapping: any = [];
  activeServiceDetail: any = [];
  externalMappedCustomer: any = [];
  unMappedExternalCustomers: any = [];
  activeExternalCustomers: any = [];
  activeExternalProducts: any = [];
  activeBillingCycles: any = [];
  mappedEntity: any = [];
  mappedProducts: any = [];
  providerTenants: any = [];
  defaultCategorySelection: any =  [{ Description: '--All categories--', ID: null,CategoryDescriptionKey : '--All categories--' }];
  defaultTenantSelection: any = [{ CustomerName: '--All tenants--', ServiceProviderCustomerId: null }];
  selectedContract: any;
  selectedContractBillingCycle: any = [];
  c3ProductsList: any = [];
  selectedServiceProviderCustomer: any;
  selectedCategory: any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  activeProductsDatatableConfig: ADTSettings;
  isRefreshInprocess:boolean;
  @ViewChild('textBox') textBox: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actionHeader') actionHeader: TemplateRef<any>;
  @ViewChild('specialQualificationsModal') specialQualificationsModal: TemplateRef<any>; 


  constructor(private _translateService: TranslateService,
    private _commonService: CommonService,
    public _permissionService: PermissionService,
    private cdRef: ChangeDetectorRef,
    private _appSettings:AppSettingsService,
    public _router: Router,
    private _fb: FormBuilder,
    public _route: ActivatedRoute,
    public _dynamicTemplateService: DynamicTemplateService,
    private _modalService: NgbModal,
    private notifierService: NotifierService,
    private toastService: ToastService,
    private _productMappingService: ProductMappingService,
    private _unsavedChangesService: UnsavedChangesService,
    private _pageInfo:PageInfoService,
    public themeMode:ThemeModeService

  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appSettings)
    _route.params.subscribe((params: any) => {
      this.providerName = params['providerName']
    })

    this.purchasedProductMappingForm = this._fb.group({
      customerName: [''],
      psaCustomerName: [''],
      contractServiceId: [''],
      contractServiceName: [''],
      mappedExternalProductId: [''],
    });

  }

  ngOnInit(): void {
    const subscription = this._productMappingService.isRefreshInprocess$.pipe(takeUntil(this.destroy$)).subscribe(res=>{
      this.isRefreshInprocess = res;
   })
   this._subscriptionArray.push(subscription);
    this.getActiveServiceDetails();
    this.getBillingCycle();
    this.getCategories();

    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
  }

  getActiveServiceDetails() {
    const subscription = this._appSettings.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeServiceDetail = response;
    })
    this._subscriptionArray.push(subscription);
  }

  getActiveC3Customers() {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */

    const modalRef = this._modalService.open(PurchaseProductMappingCustomerNamePopUPComponent, {size:'xl'});
    modalRef.componentInstance.purchasedProductMapping = this.purchasedProductMapping;
    modalRef.result.then(
      (result) => {
        if (result) {

          this.purchasedProductMappingForm.get('customerName').setValue(result.Name);
          //this.selectedCustomer = c3Customer.Name;
          this.purchasedProductMapping.C3Id = result[0].C3Id;
          this.purchasedProductMapping.EntityId = result[0].EntityId;
          this.purchasedProductMapping.RecordId = result[0].ID;

          this.unMappedExternalCustomers = [];
          this.unMappedExternalCustomers = _.filter(this.activeExternalCustomers, (td: any) => {
            return td.IsMapped === false;
          });

          this.mappedEntity.ExternalCustomerId = null;
          this.mappedEntity.AgreementId = null;

          this.purchasedProductMapping.ExternalCustomerId = null;
          this.purchasedProductMapping.ExternalCustomerName = null;
          this.purchasedProductMapping.AgreementId = null;
          this.purchasedProductMapping.AgreementName = null;
          this.purchasedProductMapping.AgreementStartDate = null;
          this.purchasedProductMapping.AgreementEndDate = null;
          this.purchasedProductMapping.BillingCycleId = null;
          this.purchasedProductMapping.BillingCycleName = null;
          this.purchasedProductMapping.IsDefault = false;
          this.purchasedProductMapping.CategoryId = null;
          this.purchasedProductMapping.ServiceProviderCustomerId = null;

          this.purchasedProductMapping.CustomerName = result[0].Name;
          this.purchasedProductMapping.C3Id = result[0].C3Id
          this.purchasedProductMapping.CustomerId = result[0].ID;

          this.getActiveExternalMappedCustomer();
          this.getProviderTenants();

        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  getProviderTenants() {
    if (this.purchasedProductMapping.C3Id && this.purchasedProductMapping.C3Id !== null) {
      const subscription = this._productMappingService.getProviderTenants(this.purchasedProductMapping.C3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        if (response.Data && response.Data.length > 1) {
          this.providerTenants = [...this.defaultTenantSelection]
          this.providerTenants = this.providerTenants.concat(response.Data);
          this.selectedServiceProviderCustomer = this.providerTenants[0];
        }
      })
      this._subscriptionArray.push(subscription);
    }

  }

  onServiceProviderCustomerChange(){
    this.purchasedProductMapping.ServiceProviderCustomerId = this.selectedServiceProviderCustomer.ServiceProviderCustomerId
  }


  getCategories() {
    const subscription = this._commonService.getCategoriesForSubscription().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.categories = [...this.defaultCategorySelection]
      this.categories = this.categories.concat(response.Data);
      this.categories = _.filter(this.categories, each => each.Name !== 'PerpetualSoftware'
        && each.Description !== 'Non-CSP Azure'
        && each.Name !== 'OneTime'
        && each.Name !== 'LicenseSupported')
      this.categories = _.map(this.categories, each => {
        if (each.Name === 'OnlineServicesNCE')
          each.Description = 'NCE'
        return each;
      });
      this.selectedCategory = this.categories[0];
    })
    this._subscriptionArray.push(subscription);
  }

  onCategoryChange(){
    this.purchasedProductMapping.CategoryId = this.selectedCategory.ID
  }

  getActiveEntites() {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */
    const modalRef = this._modalService.open(PurchaseProductMappingPSACustomerPopupComponent, {size:'xl'});
    modalRef.componentInstance.purchasedProductMapping = this.purchasedProductMapping;
    modalRef.componentInstance.activeServiceDetail = this.activeServiceDetail.Name;
    modalRef.result.then(
      (result) => {
        if (result) {

          let c3Customer = result[0];
          //this.selectedPSACustomer = c3Customer.Name;
          this.purchasedProductMappingForm.get('psaCustomerName').setValue(result.Name);
          this.unMappedExternalCustomers = [];
          this.unMappedExternalCustomers = _.filter(this.activeExternalCustomers, function (td) {
            return td.IsMapped === false;
          });

          this.purchasedProductMapping.AgreementId = null;
          this.purchasedProductMapping.AgreementName = null;
          this.purchasedProductMapping.AgreementStartDate = null;
          this.purchasedProductMapping.AgreementEndDate = null;
          this.purchasedProductMapping.BillingCycleId = null;
          this.purchasedProductMapping.BillingCycleName = null;
          this.purchasedProductMapping.IsDefault = false;
          this.purchasedProductMapping.CategoryId = null;
          this.purchasedProductMapping.ServiceProviderCustomerId = null;

          this.mappedEntity.ExternalCustomerId = null;
          this.mappedEntity.AgreementId = null;

          this.purchasedProductMapping.ExternalCustomerName = c3Customer.Name;
          this.purchasedProductMapping.ExternalCustomerId = c3Customer.Id;
          //this.GetActiveAgreements();

        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  getActiveContracts() {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */
    
    const modalRef = this._modalService.open(PurchaseProductMappingContractPopupComponent, {size:'xl'});
    modalRef.componentInstance.purchasedProductMapping = this.purchasedProductMapping;
    modalRef.componentInstance.activeServiceDetail = this.activeServiceDetail.Name;
    modalRef.result.then(
      (result) => {
        if (result) {

          let selectedAgreement = result[0];
          this.selectedContract = selectedAgreement.Name;
          this.purchasedProductMappingForm.get('contractServiceName').setValue(result.Name);
          this.purchasedProductMapping.AgreementId = selectedAgreement.Id
          this.selectedContractBillingCycle = selectedAgreement.BillingCycle;
          this.purchasedProductMapping.AgreementName = selectedAgreement.Name;
          this.purchasedProductMapping.AgreementStartDate = selectedAgreement.StartDate;
          this.purchasedProductMapping.AgreementEndDate = selectedAgreement.EndDate;
          this.purchasedProductMapping.IsDefault = null;
          this.purchasedProductMapping.CategoryId = null;
          this.purchasedProductMapping.ServiceProviderCustomerId = null;

          if (selectedAgreement.BillingCycle !== undefined && selectedAgreement.BillingCycle !== null) {
            let billingCycle = this.activeBillingCycles.filter((x: any) => {
              return x.Name.toLowerCase() == selectedAgreement.BillingCycle.toLowerCase();
            });
            this.purchasedProductMapping.BillingCycleId = billingCycle[0].ID;
            this.purchasedProductMapping.BillingCycleName = billingCycle[0].Name;
            this.purchasedProductMapping.BillingCycleDescriptionKey = billingCycle[0].Description;
          }
          //this.reloadEvent.emit(true);
          this.getActiveC3Products();
          this.getActiveExternalProducts();
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  getBillingCycle() {
    const subscription = this._commonService.getBillingCycles().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeBillingCycles = response;

    })
    this._subscriptionArray.push(subscription);
  }
  getActiveExternalProducts() {
    var reqBody = {
      entityName: this._commonService.entityName,
      recordId: this._commonService.recordId,
      BillingCycleName: this.purchasedProductMapping.BillingCycleName,
      Name: '',
      StartInd: 1,
      PageSize: 200,
      EndInd: 0,
      SortOrder: "Name",
      SortColumn: "ASC",
    };
    const subscription = this._productMappingService.getActiveExternalProducts(reqBody).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeExternalProducts = response.Data;
      this.getMapping();
    })
    this._subscriptionArray.push(subscription);

  }

  getExternalProductsForMapping(row: any) { 
    /* selecting Size of popup based on condition */
    const modalRef = this._modalService.open(PurchaseProductMappingProductsPopupComponent, {size: 'xl'});
    modalRef.componentInstance.purchasedProductMapping = this.purchasedProductMapping;
    modalRef.componentInstance.activeServiceDetails = this.activeBillingCycles;
    modalRef.componentInstance.c3Product = row;
    modalRef.result.then(
      (result) => {
        if (result) {
          // let selectedExternalProduct = result;

          // let extproduct = _.filter(this.c3ProductsList, (td: any) => {
          //   return td.ProductSubscriptionId == result.ProductSubscriptionId;
          // });
          // result.selectedExternalProducts = extproduct[0].ContractServiceName;
          // result.ContractServiceId = extproduct[0].ContractServiceId;
          row = result
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  getMapping() {
    let postReq = {
      ExternalServiceName: this.activeServiceDetail.Name,
      EntityId: this.purchasedProductMapping.EntityId,
      RecordId: this.purchasedProductMapping.RecordId,
      ExternalCustomerId: this.purchasedProductMapping.ExternalCustomerId,
      AgreementId: this.purchasedProductMapping.AgreementId
    };

    const subscription = this._productMappingService.getMapping(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.existingMapping = response.Data;
      if (this.existingMapping.EntityMappings) {
        this.purchasedProductMapping.IsDefault = this.existingMapping.EntityMappings.IsDefault;
        this.purchasedProductMapping.CategoryId = this.existingMapping.EntityMappings.CategoryId;
        this.selectedCategory = _.find(this.categories,(category) =>{
         return category.ID === this.existingMapping.EntityMappings.CategoryId;
        });
        this.purchasedProductMapping.ServiceProviderCustomerId = this.existingMapping.EntityMappings.ServiceProviderCustomerId;
      } else {
        this.purchasedProductMapping.IsDefault = false;
      }
      this.getActiveC3Products();
    });
    this._subscriptionArray.push(subscription);
  }

  getActiveExternalMappedCustomer() {
    let customerC3Id = this.purchasedProductMapping.C3Id
    const subscription = this._productMappingService.getActiveExternalMappedCustomer(customerC3Id).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.externalMappedCustomer = response.Data;
      this.PushMappedExternalCustomerForUISelect();

      if (this.externalMappedCustomer !== undefined && this.externalMappedCustomer !== null) {
        if (this.externalMappedCustomer.Id !== undefined && this.externalMappedCustomer.Id !== null) {
          this.mappedEntity.ExternalCustomerId = this.externalMappedCustomer.Id;
          this.purchasedProductMapping.ExternalCustomerId = this.externalMappedCustomer.Id;
          this.purchasedProductMapping.ExternalCustomerName = this.externalMappedCustomer.Name;
          //this.GetActiveAgreements();
        }
      }

    });
    this._subscriptionArray.push(subscription);
  }

  PushMappedExternalCustomerForUISelect() {
    if (this.externalMappedCustomer && this.externalMappedCustomer.Id) {
      let matchingExternalCustomer = this.activeExternalCustomers.find((map: any) => {
        return map.Id == this.externalMappedCustomer.Id;
      });

      if (true) {
        this.unMappedExternalCustomers.push(matchingExternalCustomer);
      } else {
        //If this.activeExternalCustomers has not been loaded yet
        this.unMappedExternalCustomers.push({
          Id: this.externalMappedCustomer.Id,
          Name: this.externalMappedCustomer.Name
        });
      }
    }
  }

  getC3Products(): Promise<any[]>{
    return new Promise((resolve, reject) => {
    const reqModel = {
      CustomerC3Id: this.purchasedProductMapping.C3Id,
      ExternalCustomerId: this.purchasedProductMapping.ExternalCustomerId,
      AgreementId: this.purchasedProductMapping.AgreementId,
      BillingCycleId: this.purchasedProductMapping.BillingCycleId,
      CategoryId: this.purchasedProductMapping.CategoryId,
      ServiceProviderCustomerId: this.purchasedProductMapping.ServiceProviderCustomerId,
    };
    this._subscription && this._subscription?.unsubscribe();
    const subscription =  this._productMappingService.GetActiveC3Products(reqModel)
      .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
        let recordsTotal = 0;
        this.c3ProductsList = [];
        if (Data.length > 0) {
          recordsTotal = Data.length;
         

          if (this.existingMapping !== undefined && this.existingMapping !== null && this.existingMapping.EntityMappings !== undefined && this.existingMapping.EntityMappings !== null) {
            this.mappedEntity.ExternalCustomerId = this.existingMapping.EntityMappings.ExternalCustomerId;
            this.mappedEntity.AgreementId = this.existingMapping.EntityMappings.ContractId;
          }
          else {
            this.mappedEntity.ExternalCustomerId = null;
            this.mappedEntity.AgreementId = null;
            this.getActiveExternalMappedCustomer();
          }

          if (this.existingMapping.ProductMappings !== undefined && this.existingMapping.ProductMappings !== null && this.existingMapping.ProductMappings.length > 0) {
            _.each(Data, (row: any) => {

              var matchingProduct = _.find(this.existingMapping.ProductMappings, map => {
                return map.SubscriptionId == row.ProductSubscriptionId;
              });
              if (matchingProduct !== undefined && matchingProduct !== null) {
                row.ContractServiceId = matchingProduct.ContractServiceId;
                row.ContractServiceName = matchingProduct.ContractServiceName;
                row.MappedExternalProductId = matchingProduct.ContractServiceId;
              }
            });
          }
          this.c3ProductsList = Data;

          var defaultMappedproduct = _.find(Data, (map: any) => {
            return map.MappedExternalProductId !== undefined && map.MappedExternalProductId !== null;
          });
        }
        resolve(this.c3ProductsList || []);
      });
      this._subscriptionArray.push(subscription);
    });
    
  }

  async getActiveC3Products()  {
    let self = this;
    await self.getC3Products();
    self.activeProductsDatatableConfig = null;
    self.cdRef.detectChanges();
    setTimeout( () => {
      self.activeProductsDatatableConfig = {
        serverSide: false,
        pagingType: 'full_numbers',
        pageLength: (self._appSettings.$rootScope.DefaultPageCount || 10), 
        data: self.c3ProductsList,
        ordering: false,
        columns: [
          {
            type:'string',
            className: 'col-md-4',
            title: self._translateService.instant('TRANSLATE.CUSTOMER_PURCHASED_PRODUCT_MAPPING_TABLE_HEADER_TEXT_C3_PRODUCTS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: self.propertiespills,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-6',
            type:'string',
            title: self._translateService.instant('TRANSLATE.CUSTOMER_PURCHASED_PRODUCT_MAPPING_TABLE_HEADER_TEXT_EXTERNAL_PRODUCTS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: self.textBox,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
            searchable: false
          },
          {
            className: 'col-md-2 text-center',
            title: 'Actions',
            type:'string',
            defaultContent: '',
            ngTemplateRef: {
              ref: self.actions,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
    });
  }

  onCaptureEvent(event: Event) { }

  Savemapping() {
    const confirmationMessage = this._translateService.instant('TRANSLATE.PRODUCT_MAPPING_POPUP_CONFIRM_TEXT_SAVE_MAPPING', { customerName: this.purchasedProductMapping.CustomerName });
    this.notifierService.confirm({ title: confirmationMessage,confirmButtonColor:'green' }).then((result) => {
      if (result.isConfirmed) {
        let data = this.purchasedProductMapping;
        let products = this.c3ProductsList;

        let defaultMappedProduct = null;
        defaultMappedProduct = _.find(products, map => {
          return map.ContractServiceId !== undefined && map.ContractServiceId !== null;
        });
        if (defaultMappedProduct !== undefined && defaultMappedProduct !== null) {

          _.each(products, (product: any) => {

            let mappedProduct = {
              SubscriptionId: product.ProductSubscriptionId,
              ContractServiceId: product.ContractServiceId,
              ContractServiceName: product.ContractServiceName
            };

            this.mappedProducts.push(mappedProduct);

          });

          let postReq = {
            EntityMappings: {
              ExternalServiceId: this.activeServiceDetail.Id,
              ExternalServiceName: this.activeServiceDetail.Name,
              EntityId: this.purchasedProductMapping.EntityId,
              RecordId: this.purchasedProductMapping.RecordId,
              CustomerName: this.purchasedProductMapping.CustomerName,
              CustomerId: this.purchasedProductMapping.CustomerId,
              CustomerC3Id: this.purchasedProductMapping.C3Id,
              ExternalCustomerId: this.purchasedProductMapping.ExternalCustomerId,
              ExternalCustomerName: this.purchasedProductMapping.ExternalCustomerName,
              ContractId: this.purchasedProductMapping.AgreementId,
              ContractName: this.purchasedProductMapping.AgreementName,
              ContractStartDate: this.purchasedProductMapping.AgreementStartDate,
              ContractEndDate: this.purchasedProductMapping.AgreementEndDate,
              BillingCycleId: this.purchasedProductMapping.BillingCycleId,
              BillingCycleName: this.purchasedProductMapping.BillingCycleName,
              IsDefault: this.purchasedProductMapping.IsDefault,
              CategoryId: this.purchasedProductMapping.CategoryId,
              ServiceProviderCustomerId: this.purchasedProductMapping.ServiceProviderCustomerId
            },
            ProductMappings: this.mappedProducts
          };
          const subscription = this._productMappingService.saveMapping(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            let mappingResult = response.Data;
            if (mappingResult && mappingResult.MessageKey) {
              this.toastService.error(
                this._translateService.instant('TRANSLATE.' + mappingResult.MessageKey)
              );
            } else {
              if (mappingResult && mappingResult.DefaultDisabledContracts) {
                this.toastService.success(
                  this._translateService.instant('TRANSLATE.ENTITY_MAPPING_NOTIFIER_TEXT_DISABLED_DEFAULT_CONTRACTS', { ContractNames: mappingResult.DefaultDisabledContracts })
                );

              }
              this.toastService.success(
                this._translateService.instant('TRANSLATE.ENTITY_MAPPING_NOTIFIER_TEXT_MAPPING_SAVED_SUCCESSFULLY')
              );
              this._router.navigate(['partner/business/subscriptionhistory']);
            }
          })
          this._subscriptionArray.push(subscription);
        } else {
          // const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_NOTIFIER_TEXT_ATLEAST_MAP_ONE_PRODUCT');
          // this.notifierService.confirm({ title: confirmationMessage })
          this.toastService.error(
            this._translateService.instant('TRANSLATE.ENTITY_MAPPING_NOTIFIER_TEXT_ATLEAST_MAP_ONE_PRODUCT')
          );
          
          //this.reloadEvent.emit(true);
        }
      }
    });
  }

  unMappExternalService(externalCustomerId: any, agreementId: any, externalProductId: any, subscriptionId: any) {
    const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_MAPPING_CONFIRM_TEXT_RELEASE_MAPPING');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        let postReq = {
          ExternalCustomerId: externalCustomerId,
          AgreeementId: agreementId,
          ExternalProductId: externalProductId,
          SubscriptionId: subscriptionId
        };
        const subscription = this._productMappingService.UnMappExternalService(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this.existingMapping = response.Data;
          if (externalProductId === undefined || externalProductId === null || externalProductId === "") {
            this.runOnCustomerAndAgreementMappingRelease(agreementId);
          } else {
            this.getMapping();
          }
          this.reloadEvent.emit(true);
        })
        this._subscriptionArray.push(subscription);
      }
    });
  }

  runOnCustomerAndAgreementMappingRelease(agreementId: any) {

    this.purchasedProductMapping.AgreementId = null;
    this.purchasedProductMapping.AgreementName = null;
    this.purchasedProductMapping.AgreementStartDate = null;
    this.purchasedProductMapping.AgreementEndDate = null;
    this.purchasedProductMapping.BillingCycleId = null;
    this.purchasedProductMapping.BillingCycleName = null;
    this.purchasedProductMapping.IsDefault = false;
    this.purchasedProductMapping.CategoryId = null;
    this.purchasedProductMapping.ServiceProviderCustomerId = null;

    this.mappedEntity.AgreementId = null;
    this.mappedEntity.ExternalCustomerId = null;

    if (agreementId === undefined || agreementId === null || agreementId === "") {
      this.purchasedProductMapping.ExternalCustomerId = null;
      this.purchasedProductMapping.ExternalCustomerName = null;
      this.getActiveExternalMappedCustomer();
    }
  }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  back(){
    let callback = ()=>{
      this._router.navigate(['partner/business/subscriptionhistory']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.purchasedProductMappingForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }
}
