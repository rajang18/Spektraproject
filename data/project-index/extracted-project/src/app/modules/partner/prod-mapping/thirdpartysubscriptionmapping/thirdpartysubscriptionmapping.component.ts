import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import _ from 'lodash';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PurchasedProductMappingModel } from '../Models/purchasedProductMappingModel';
import { ProductMappingService } from '../services/productmapping.service';
import { PurchaseProductMappingPSACustomerPopupComponent } from 'src/app/modules/standalones/product-mapping-popups/purchase-product-mapping-psa-customer-popup/purchase-product-mapping-psa-customer-popup.component';
import { ThirdPartySubscribtionContractMappingPopUpComponent } from 'src/app/modules/standalones/product-mapping-popups/third-party-subscription-mapping-popups/third-party-contract-popup/third-party-contract-popup.component';
import { ThirdPartySubscriptionProductPopupComponentComponent } from 'src/app/modules/standalones/product-mapping-popups/third-party-subscription-mapping-popups/third-party-product-popup/third-party-product-popup.component';
import { Subject} from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { ThemeModeService } from 'src/app/_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';

@Component({
  selector: 'app-thirdpartysubscriptionmapping',
  templateUrl: './thirdpartysubscriptionmapping.component.html',
  styleUrl: './thirdpartysubscriptionmapping.component.scss'
})
export class ThirdpartysubscriptionmappingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  pageMode: string = 'thirdPartyEntityMapping';
  providerName: string;
  providerDetails: any[];
  purchasedProductMappingForm: FormGroup;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  productScreenReloadEvent: EventEmitter<boolean> = new EventEmitter();
  ServiceProviderCustomers: any[];
  CustomerConsentModel: any = [];
  specialQualificationDetails: any = [];
  Categories: any = [];
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
  c3CustomerList: any = [];
  mappedEntity: any = [];
  mappedProducts: any = [];
  selectedContract: any;
  c3ThirdPartySubscriptionList: any = [];
  selectedContractBillingCycle: any = [];
  activeEntitiesDatatableConfig: ADTSettings;
  activeThirdPartyProductsDatatableConfig: ADTSettings;
  @ViewChild('textBox') textBox: TemplateRef<any>;
  @ViewChild('textBox2') textBox2: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actionHeader') actionHeader: TemplateRef<any>; 

  @ViewChild('specialQualificationsModal') specialQualificationsModal: TemplateRef<any>;


  constructor(private _translateService: TranslateService,
    private _commonService: CommonService,
    private _appSettings:AppSettingsService,
    public _permissionService: PermissionService,
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private _fb: FormBuilder,
    public _route: ActivatedRoute,
    public _dynamicTemplateService: DynamicTemplateService,
    private toastService: ToastService,
    private _modalService: NgbModal,
    private notifierService: NotifierService,
    private _appService: AppSettingsService,
    private _productMappingService: ProductMappingService,
    private _unsavedChangesService: UnsavedChangesService,
    private _pageInfo:PageInfoService,
    public themeMode:ThemeModeService
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
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
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE','CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
    this.getActiveServiceDetails();
    this.getActiveC3Customers();
  }

  getActiveServiceDetails() {
    this._appSettings.getActiveServiceDetail().subscribe((response: any) => {
      this.activeServiceDetail = response;
    })
  }

  on3PartyMenuClick(val: any) {
    if (val === 'thirdPartyEntityMapping') {
      this.pageMode = 'thirdPartyEntityMapping';
    }
    if (val === 'thirdPartyProductMapping') {
      this.pageMode = 'thirdPartyProductMapping';
      this.getActiveProduct();
    }
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
    this._productMappingService.getActiveExternalProducts(reqBody).subscribe((response: any) => {
      this.activeExternalProducts = response.Data;
      this.GetMapping();
    })
  }

  GetMapping() {
    let postReq = {
      ExternalServiceName: this.activeServiceDetail.Name,
      EntityId: this.purchasedProductMapping.EntityId,
      RecordId: this.purchasedProductMapping.RecordId,
      ExternalCustomerId: this.purchasedProductMapping.ExternalCustomerId,
      AgreementId: this.purchasedProductMapping.AgreementId
    };

    this._productMappingService.getMapping(postReq).subscribe((response: any) => {
      this.existingMapping = response.Data;
      if (this.existingMapping.EntityMappings) {
        this.purchasedProductMapping.IsDefault = this.existingMapping.EntityMappings.IsDefault;
        this.purchasedProductMapping.CategoryId = this.existingMapping.EntityMappings.CategoryId;
        this.purchasedProductMapping.ServiceProviderCustomerId = this.existingMapping.EntityMappings.ServiceProviderCustomerId;
      } else {
        this.purchasedProductMapping.IsDefault = false;
      }
      this.getActiveC3Customers();
    });

  }

  getActiveContracts(row: any) {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };
    const modalRef = this._modalService.open(ThirdPartySubscribtionContractMappingPopUpComponent, {size: 'xl'});
    modalRef.componentInstance.ExternalCustomerId= row.ExternalCustomerId,
    modalRef.componentInstance.purchasedProductMapping = this.purchasedProductMapping;
    modalRef.componentInstance.c3Customers = row;
    modalRef.componentInstance.activeServiceDetail = this.activeServiceDetail.Name;
    modalRef.result.then(
      (result) => {
        if (result) {

          let c3Customer = result;
          this.selectedContract = c3Customer.Name;
          let matchingC3data = this.c3CustomerList;
          let matchingCustomer = _.find(matchingC3data, map => {
            return map.ID == result.ID;
          });
          if (matchingCustomer !== undefined && matchingCustomer !== null) {
            row.AgreementId = result.selectedContract.Id;
            row.AgreementName = result.selectedContract.Name;
          }
        }

      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  getActiveC3Customers() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.activeEntitiesDatatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, length, EndInd } =
            mapParamsWithApi(dataTablesParameters);
          let nameFilter = Name;
          if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
            nameFilter = Name
          }
          const searchParams = {
            StartInd,
            Name: nameFilter,
            SortColumn,
            SortOrder,
            PageSize:length,
            EndInd
          }
          subscription && subscription?.unsubscribe();
          subscription = this._productMappingService.getActiveEntitesForThirdPartyMapping(searchParams)
            .subscribe(({ Data }: any) => {

              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
                this.c3CustomerList = Data
                _.each(Data, function (row) {
                  row.ExternalCustomerId = row.MappedExternalCustomerId;
                  row.ExternalCustomerName = row.MappedExternalCustomerName
                  row.AgreementId = row.MappedExternalAgreementId;
                  row.AgreementName = row.MappedExternalAgreementName;
                  row.IsMapped = row.IsMapped;
                });

              }
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
        },
        columns: [
          {
            className: 'col-md-2',
            searchable: true,
            orderable:true,
            type:'string',
            title: this._translateService.instant('TRANSLATE.THIRD_PARTY_PRODUCT_MAPPING_TABLE_HEADER_TEXT_C3_CUSTOMER'),
            defaultContent: '',
            data: 'Name'
          },
          {
            className: 'col-md-4',
            type:'string',
            title: this._translateService.instant('TRANSLATE.THIRD_PARTY_PRODUCT_MAPPING_TABLE_HEADER_TEXT_PSA_CUSTOMER'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.textBox,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
            searchable: false
          },
          {
            className: 'col-md-4',
            type:'string',
            title: this._translateService.instant('TRANSLATE.THIRD_PARTY_PRODUCT_MAPPING_TABLE_HEADER_TEXT_AGREEMENT'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.textBox2,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
            searchable: false
          },
          {
            className: 'col-md-2',
            title: 'Actions',
            defaultContent: '',
            type:'string',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
    });
  }

  getActiveEntites(row: any) {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };
    const modalRef = this._modalService.open(PurchaseProductMappingPSACustomerPopupComponent, {size: 'xl'});
    //modalRef.componentInstance.WebhookNotificationDetailsData = this.webhookNotificationDetails;
    modalRef.result.then(
      (result) => {
        if (result) {

          let c3Customer = result;
          //this.selectedPSACustomer = c3Customer.Name;
          this.purchasedProductMappingForm.get('psaCustomerName').setValue(result.Name);
          this.unMappedExternalCustomers = [];
          // this.unMappedExternalCustomers = _.filter(this.activeExternalCustomers, function (td) {
          //   return td.IsMapped === false;
          // });

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

  getActiveProduct() {
    let subscription
    setTimeout(() => {
      const self = this;
      this.activeThirdPartyProductsDatatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, ProductName, SortColumn, SortOrder, length, EndInd, WhereClauseXML } =
            mapParamsWithApi(dataTablesParameters);
          let nameFilter = ProductName;
          if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
            nameFilter = ProductName
          }
          const reqModel = {
            StartInd,
            ProductName: nameFilter,
            ExternalServiceName: this.activeServiceDetail.Name,
            SortColumn,
            SortOrder,
            PageSize:length,
            EndInd,
            WhereClauseXML
          };
          subscription && subscription?.unsubscribe();
          subscription = this._productMappingService.getC3ThirdPartySubscriptions(reqModel)
            .subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
                this.c3ThirdPartySubscriptionList = Data
                _.each(Data, (row: any) => {
                  row.MappedExternalProductId = row.ExternalProductId,
                  row.MappedExternalProductName = row.ExternalProductName

                  var existingMappedProduct = _.find(this.mappedProducts, map => {
                    return map.ProductVarientId === row.ProductVarientId && map.ProductVarientName === row.ProductVarientName && map.BillingCycle === row.BillingCycle && map.CurrencyCode === row.CurrencyCode && map.Validity === row.Validity && map.ValidityType === row.ValidityType;
                  });

                  if (existingMappedProduct !== undefined && existingMappedProduct !== null) {
                    var index = this.mappedProducts.indexOf(existingMappedProduct);
                    row.MappedExternalProductId = this.mappedProducts[index].MappedExternalProductId;
                    row.MappedExternalProductName = this.mappedProducts[index].MappedExternalProductName;
                  }
                });
                
              }
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
        },
        ordering: false,
        columns: [
          {
            
            className: 'col-md-4',
            searchable: true,
            type:'string',
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PURCHASED_PRODUCT_MAPPING_TABLE_HEADER_TEXT_C3_PRODUCTS'),
            defaultContent: '',
            data: 'ProductName'
          },
          {
            type:'string',
            className: 'col-md-6',
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PURCHASED_PRODUCT_MAPPING_TABLE_HEADER_TEXT_EXTERNAL_PRODUCTS'),
            defaultContent: '',
            ngTemplateRef: {
              ref: this.textBox,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
            searchable: false
          },
          {
            className: 'col-md-4',
            title: 'Actions',
            type:'string',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
      };
    });
  }

  getExternalProductsForMapping(row: any) {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };
    const modalRef = this._modalService.open(ThirdPartySubscriptionProductPopupComponentComponent, {size: 'xl'});
    modalRef.componentInstance.activeServiceDetails = this.activeServiceDetail;
    modalRef.componentInstance.c3Product = row;
    modalRef.result.then(
      (result) => {
        if (result) {

          let selectedExternalProduct = result;
          this.c3ThirdPartySubscriptionList.ExternalProductId = selectedExternalProduct.MappedExternalProductId
          this.c3ThirdPartySubscriptionList.ExternalProductName = selectedExternalProduct.MappedExternalProductName;

        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  SaveThirdPartySubscriptionEntityMapping(row: any) {

    const confirmationMessage = this._translateService.instant('TRANSLATE.THIRD_PARTY_ENTITY_MAPPING_NOTIFIER_TEXT_SAVE_MAPPING', { customerName: row.Name });
    this.notifierService.confirm({ title: confirmationMessage,confirmButtonColor:'green' }).then((result) => {
      if (result.isConfirmed) {
        let postReq = {
          ExternalServiceId: this.activeServiceDetail.Id,
          ExternalServiceName: this.activeServiceDetail.Name,
          CustomerId: row.ID,
          CustomerName: row.Name,
          CustomerC3Id: row.C3Id,
          EntityId: row.EntityId,
          RecordId: row.ID,
          ExternalCustomerId: row.ExternalCustomerId,
          ExternalCustomerName: row.ExternalCustomerName,
          ExternalAgreementId: row.AgreementId,
          ExternalAgreementName: row.AgreementName
        };

        this._productMappingService.saveThirdParyEntityMapping(postReq).subscribe((response: any) => {

          let mappingResult = response.Data;
          if (mappingResult && mappingResult.MessageKey) {
            this.toastService.success(
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
            this._router.navigate(['partner/business/subscriptionhistory'])
          }
        })
      } 
    });
  }

  saveThirdPartyProductMapping() {
    const confirmationMessage = this._translateService.instant('TRANSLATE.PRODUCT_MAPPING_POPUP_CONFIRM_TEXT_SAVE_MAPPING');
    this.notifierService.confirm({ title: confirmationMessage,confirmButtonColor:'green' }).then((result) => {
      if (result.isConfirmed) {
        let data = this.purchasedProductMapping;
        let products = this.c3ThirdPartySubscriptionList;
        let defaultMappedProduct = null;
        defaultMappedProduct = _.find(products, (map: any) => {
          return map.MappedExternalProductId !== undefined && map.MappedExternalProductId !== null;
        });
        if (defaultMappedProduct !== undefined && defaultMappedProduct !== null) {
          /* the below section can be removed but due to insufficent data it is not removed */

          products.forEach((product:any) => {

            let mappedProduct = {
              ThirdPartySubscriptionName: product.ProductName,
              MappedExternalProductId: product.MappedExternalProductId,
              MappedExternalProductName: product.MappedExternalProductName,

            };

            this.mappedProducts.push(mappedProduct);

          });

          let postReq = {
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            ExternalServiceName: this.activeServiceDetail.Name,
            ThirdPartySoftwareMapping: this.mappedProducts
          }
          this._productMappingService.saveThirdParyProductMapping(postReq).subscribe((response: any) => {

            let mappingResult = response.Data;
            if (mappingResult && mappingResult.MessageKey) {
              this.toastService.success(
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
              this._router.navigate(['partner/business/subscriptionhistory'])
            }
          })
        } else {
          const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_NOTIFIER_TEXT_ATLEAST_MAP_ONE_PRODUCT');
          this.notifierService.confirm({ title: confirmationMessage })
          this.productScreenReloadEvent.emit(true);
        }
      }
    });
  }

  UnMappThirdPartyEntityMapping(data: any) {
    const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_MAPPING_CONFIRM_TEXT_RELEASE_MAPPING');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        let postReq = {
          CustomerId: data.ID,
          CustomerC3Id: data.C3Id,
          ExternalCustomerId: data.ExternalCustomerId,
          ExternalAgreementId: data.AgreementId
        };
        this._productMappingService.UnMappThirdPartyEntityMapping(postReq).subscribe((response: any) => {
          this.existingMapping = response.Data;
          this.reloadEvent.emit(true);
        })
      }
    });
  }

  UnMappThirdPartyProduct(product) {
    const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_MAPPING_CONFIRM_TEXT_RELEASE_MAPPING');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        let postReq = {
          ExternalProductId: product.ExternalProductId,
          ExternalProductName: product.ExternalProductName,
          ThirdPartySoftwareName: product.ProductName
      };
        this._productMappingService.unmapthirdpartyproduct(postReq).subscribe((response: any) => {
          this.existingMapping = response.Data;
          this.productScreenReloadEvent.emit(true);
          this.reloadEvent.emit(true);
        })
      }
    });
  }

  onCaptureEvent(event: Event) { }
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
