import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ProductMappingService } from '../services/productmapping.service';
import { PurchasedProductMappingModel } from '../Models/purchasedProductMappingModel';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import _ from 'lodash';
import { ToastService } from 'src/app/services/toast.service';
import { ProductMappingNewPSAProductCreationComponentComponent } from 'src/app/modules/standalones/product-mapping-popups/new-product-mapping-popup/product-mapping-new-psaproduct-creation-component/product-mapping-new-psaproduct-creation-component.component';
import { NewProductMappingProductsPopupComponent } from 'src/app/modules/standalones/product-mapping-popups/new-product-mapping-popup/new-product-mapping-psa-products-popup/new-product-mapping-psa-products-popup.component';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { UnsavedChangesService } from 'src/app/services/unsaved-changes.service';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { ThemeModeService } from 'src/app/_c3-lib/partials/layout/theme-mode-switcher/theme-mode.service';
import { ResponseModel } from 'src/app/shared/interceptors/auth.interceptor';



@Component({
  selector: 'app-productmapping',
  templateUrl: './productmapping.component.html',
  styleUrl: './productmapping.component.scss'
})
export class ProductmappingComponent extends C3BaseComponent implements OnInit, OnDestroy {
  providerName: string;
  providerDetails: any[];
  purchasedProductMappingForm: FormGroup;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
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
  c3ProductVarientList: any = [];
  mappedProducts: any = [];
  selectedContract: any;
  selectedContractBillingCycle: any = [];
  isRefreshInprocess: boolean;
  activeProductsDatatableConfig: ADTSettings;
  @ViewChild('textBox') textBox: TemplateRef<any>;
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('propertiespills') propertiespills: TemplateRef<any>;
  @ViewChild('actionHeader') actionHeader: TemplateRef<any>;
  @ViewChild('specialQualificationsModal') specialQualificationsModal: TemplateRef<any>;
  StartInd: number;
  SortColumn: any;
  SortOrder: any;


  constructor(private _translateService: TranslateService,
    private _commonService: CommonService,
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
    private _pageInfo: PageInfoService,
    public themeMode: ThemeModeService

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
    this.getActiveServiceDetails();
    const subscription = this._productMappingService.isRefreshInprocess$.pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.isRefreshInprocess = res;
      this.cdRef.detectChanges();
    })
    this._subscriptionArray.push(subscription);
    this._pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS'])
    this._pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMERS_BREADCRUMB_BUTTON_TEXT_BUSINESS"), true);
  }

  getActiveServiceDetails() {
    const subscription = this._appService.getActiveServiceDetail().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
      this.activeServiceDetail = response;
      this.getActiveProduct();
    });
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
      this.GetMapping();
    })
    this._subscriptionArray.push(subscription);
  }

  GetMapping() {
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
        this.purchasedProductMapping.ServiceProviderCustomerId = this.existingMapping.EntityMappings.ServiceProviderCustomerId;
      } else {
        this.purchasedProductMapping.IsDefault = false;
      }
      this.getActiveProduct();
    });
    this._subscriptionArray.push(subscription);

  }

  getActiveProduct() {
    setTimeout(() => {
      const self = this;
      this.activeProductsDatatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, ProductVarientName, SortColumn, SortOrder, length, EndInd, WhereClauseXML } =
            mapParamsWithApi(dataTablesParameters);

          this.StartInd = this.keyForData && StartInd == 1 ? this.StartInd : StartInd;
          this.SortColumn = this.keyForData ? this.SortColumn : SortColumn;
          this.SortOrder = this.keyForData ? this.SortOrder : SortOrder;
          this.keyForData = null;

          let nameFilter = ProductVarientName;
          if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
            nameFilter = ProductVarientName
          }
          const reqModel = {
            StartInd: this.StartInd,
            ExternalServiceName: this.activeServiceDetail.Name,
            SortColumn: this.SortColumn,
            SortOrder: this.SortOrder,
            PageSize: length,
            EndInd,
            WhereClauseXML: nameFilter
          };
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productMappingService.GetC3ProductVarients(reqModel)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
                this.c3ProductVarientList = Data
                _.each(Data, (row: any) => {
                  row.ContractServiceId = row.MappedExternalProductId;
                  row.ContractServiceName = row.MappedExternalProductName;

                  var existingMappedProduct = _.find(this.mappedProducts, map => {
                    return map.ProductVarientId === row.ProductVarientId && map.ProductVarientName === row.ProductVarientName && map.BillingCycle === row.BillingCycle && map.CurrencyCode === row.CurrencyCode && map.Validity === row.Validity && map.ValidityType === row.ValidityType;
                  });

                  if (existingMappedProduct !== undefined && existingMappedProduct !== null) {
                    var index = this.mappedProducts.indexOf(existingMappedProduct);
                    row.ContractServiceId = this.mappedProducts[index].MappedExternalProductId;
                    row.ContractServiceName = this.mappedProducts[index].MappedExternalProductName;
                  }
                });
              }
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
          this._subscriptionArray.push(subscription);
        },
        columns: [
          {
            searchable: true,
            type: 'string',
            className: 'col-md-4',
            title: this._translateService.instant('TRANSLATE.CUSTOMER_PURCHASED_PRODUCT_MAPPING_TABLE_HEADER_TEXT_C3_PRODUCTS'),
            defaultContent: '',
            data: 'ProductVarientName',
            ngTemplateRef: {
              ref: this.propertiespills,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
          {
            className: 'col-md-6',
            type: 'string',
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
            className: 'col-md-2 text-center',
            title: 'Actions',
            type: 'string',
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
    /* selecting Size of popup based on condition */
    const config: NgbModalOptions = {
      modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };
    const modalRef = this._modalService.open(NewProductMappingProductsPopupComponent, { size: 'xl' });
    modalRef.componentInstance.activeServiceDetails = this.activeServiceDetail;
    modalRef.componentInstance.c3Product = row;
    modalRef.result.then(
      (result) => {
        if (result) {

          let c3Customer = result;
          let existingMappedProduct = _.find(this.mappedProducts, map => {
            return map.ProductVarientId === row.ProductVarientId && map.ProductVarientName === row.ProductVarientName && map.BillingCycle === row.BillingCycle && map.CurrencyCode === row.CurrencyCode && map.Validity === row.Validity && map.ValidityType === row.ValidityType;
          });

          if (existingMappedProduct !== undefined && existingMappedProduct !== null) {
            var index = this.mappedProducts.indexOf(existingMappedProduct);
            this.mappedProducts.splice(index, 1);
          }

          let mappedProduct = {
            ProductVarientId: row.ProductVarientId,
            ProductVarientName: row.ProductVarientName,
            BillingCycle: row.BillingCycle,
            Price: row.Price,
            ProviderPrice: row.ProviderPrice,
            CurrencyCode: row.CurrencyCode,
            MappedExternalProductId: row.ContractServiceId,
            MappedExternalProductName: row.ContractServiceName,
            Validity: row.Validity,
            ValidityType: row.ValidityType
          };

          this.mappedProducts.push(mappedProduct);
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }

  Savemapping() {
    const confirmationMessage = this._translateService.instant('TRANSLATE.PRODUCT_MAPPING_POPUP_CONFIRM_TEXT_SAVE_MAPPING', { customerName: this.purchasedProductMapping.CustomerName });
    this.notifierService.confirm({ title: confirmationMessage, confirmButtonColor: 'green' }).then((result) => {
      if (result.isConfirmed) {
        let data = this.purchasedProductMapping;
        let products = this.c3ProductVarientList;

        let defaultMappedProduct = null;

        defaultMappedProduct = _.find(products, map => {
          return map.ContractServiceId !== undefined && map.ContractServiceId !== null;
        });
        if (defaultMappedProduct !== undefined && defaultMappedProduct !== null) {

          let postReq = {
            EntityName: this._commonService.entityName,
            RecordId: this._commonService.recordId,
            ExternalServiceName: this.activeServiceDetail.Name,
            ProductMappings: this.mappedProducts
          }

          const subscription = this._productMappingService.saveProductvarientMapping(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {

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
          this._subscriptionArray.push(subscription);
        } else {
          const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_NOTIFIER_TEXT_ATLEAST_MAP_ONE_PRODUCT');
          this.notifierService.confirm({ title: confirmationMessage })
          this.reloadEvent.emit(true);
        }
      }
    });
  }

  unMapProductVariant(externalProductId: any, ProductVarientId: any) {
    const confirmationMessage = this._translateService.instant('TRANSLATE.ENTITY_MAPPING_MAPPING_CONFIRM_TEXT_RELEASE_MAPPING');
    this.notifierService.confirm({ title: confirmationMessage }).then((result) => {
      if (result.isConfirmed) {
        let postReq = {
          ExternalProductId: externalProductId,
          ProductVarientId: ProductVarientId
        };

        const subscription = this._productMappingService.unMappProductVarient(postReq).pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
          this.existingMapping = response.Data;
          this.reloadEvent.emit(true);
        })
        this._subscriptionArray.push(subscription);
      }
    });
  }

  createNewPSAProduct() {
    const moduleName = 'partner.plan';
    /* selecting Size of popup based on condition */
    // const config: NgbModalOptions = {
    //   modalDialogClass: 'modal-dialog modal-dialog-top mw-800px',
    //   size:'xl'
    // };
    const modalRef = this._modalService.open(ProductMappingNewPSAProductCreationComponentComponent, { size: 'xl' });
    modalRef.componentInstance.activeServiceDetails = this.activeServiceDetail;
    //modalRef.componentInstance.c3Product = row;
    modalRef.result.then(
      (result) => {
        if (result) {
          this.getActiveProduct
        }
      },
      (reason) => {
        /* Closing modal reference if cancelled or clicked outside of the popup*/
        modalRef.close();
      }
    );
  }
  onCaptureEvent(event: Event) { }
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._unsavedChangesService.setUnsavedChanges(false);
  }

  back() {
    let callback = () => {
      this._router.navigate(['partner/business/subscriptionhistory']);
    }
    this._unsavedChangesService.setUnsavedChanges(this.purchasedProductMappingForm.dirty);
    this._unsavedChangesService.setCallback = callback;
    this._unsavedChangesService.confirmPopup();
  }

}
