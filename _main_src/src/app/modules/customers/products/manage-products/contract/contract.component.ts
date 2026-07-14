import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { UserContextService } from 'src/app/services/user-context.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { ProductService } from 'src/app/services/product.service';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import Swal from 'sweetalert2';
import { takeUntil } from 'rxjs';
@Component({
  selector: 'app-contract',
  templateUrl: './contract.component.html',
  styleUrl: './contract.component.scss'
})
export class ManageProductContractComponent extends C3BaseComponent implements OnInit {
  pricingSlabsDatatableConfig: ADTSettings;
  slabProductsDatatableConfig: ADTSettings;
  slabProducts: any[] = null;
  pricingSlabs: any[] = null;
  product: any = null;
  datatableConfig: ADTSettings;
  showCompleteDescription: boolean = false;
  tablePlanList: any;
  permissions: any = {
    HasSaveProductChanges: 'Denied'
  };
  @ViewChild('salePrice') salePrice: TemplateRef<any>;

  sites: any[] = [];
  departments: any[] = [];
  readyToComplete: boolean = true;

  constructor(
    private _manageProduct: ManageProductService,
    private _cdref: ChangeDetectorRef,
    private _notifierService: NotifierService,
    private _userContext: UserContextService,
    private _translateService: TranslateService,
    private _commonService: CommonService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _productService: ProductService,
    private route: ActivatedRoute,
    public _appService: AppSettingsService,  
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
  }

  ngOnInit(): void {
    if (this.product) {
      localStorage.setItem('product', this.product);
    } else {
      this.product = JSON.parse(localStorage.getItem('product'));
    }
    if (this.product === undefined || this.product === null) {
      this._router.navigate(['customer/products'])
    }
    this.hasPermissions();
    this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"),true);
    this.pricingSlabsData();
    this.slabProductsData();
    this.getSites();
  }

  hasPermissions() {
    //Not added in Angular JS
    //this.permissions.HasSaveProductChanges = this._permissionService.hasPermission('BTN_SAVE_PRODUCT_CHANGES');
  }

pricingSlabsData() {
  let subscription
  setTimeout(() => {
    const self = this;
    this.pricingSlabsDatatableConfig = {
      serverSide: true,
      pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 50 ),
      ajax: (dataTablesParameters: any, callback: any) => {
        const { StartInd, Name, SortColumn, SortOrder } =
          mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productService
          .getContractPricingSlabs(this.product).pipe(takeUntil(this.destroy$))
          .subscribe(({ Data }: any) => {
            let recordsTotal = 0;
            if (Data?.length > 0) {
              recordsTotal = Data.length;
            }
            callback({
              data: (Data.slice((StartInd - 1) * 10, StartInd * 10)),
              recordsTotal: recordsTotal || 0,
              recordsFiltered: recordsTotal || 0,
            });
          });
          this._subscriptionArray.push(subscription);
      },
      columns: [
        {
          title: this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPUP_TABLE_TITLE_MINVALE'),
          data: 'MinValue',
          className: 'text-end fw-bold pe-3',
          orderable: false,
        },
        {
          title: this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPUP_TABLE_TITLE_MAXVALUE'),
          data: 'MaxValue',
          defaultContent: '',
          orderable: false,
          className: 'text-end pe-3',
          render:(data:any)=>{
            if(data != null){
              return `<span>${data}</span>`
            }
            else{
              return `<span></span>`
            }
          }
        },
        {
          title: this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPUP_TABLE_SALE_PRICE'),
          data: 'SalePrice',
          defaultContent: '',
          className: 'text-end pe-3',
          ngTemplateRef: {
            ref: this.salePrice,
            context: {
              // needed for capturing events inside <ng-template>
              captureEvents: self.onCaptureEvent.bind(self),
            },
          },
          orderable: false,
        },
        {
          title: this._translateService.instant('TRANSLATE.PLANS_MANAGE_CONTRACT_DETAILS_POPUP_TABLE_BILLING_TYPE'),
          data: 'BillingTypeName',
          render:(data:any)=>{
            if(data != null){
              return `<span>${this._translateService.instant('TRANSLATE.'+data)}</span>`
            }
            else{
              return `<span></span>`
            }
          },
          orderable: false,
        },
      ],
      order:[]
    };
  });
}

slabProductsData() {
  let subscription
  setTimeout(() => {
    const self = this;
    this.slabProductsDatatableConfig = {
      serverSide: true,
      pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
      ajax: (dataTablesParameters: any, callback: any) => {
        const { StartInd, Name, SortColumn, SortOrder } =
          mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productService.getContractSlabDetails(this.product).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => { 
              let recordsTotal = 0;
              if (Data?.length > 0) {
                recordsTotal = Data.length;
              }
              callback({
                data: (Data.slice((StartInd - 1) * 10, StartInd * 10)),
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        columns: [
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_ADD_EDIT_FORM_LABEL_PROVIDER'),
            data: 'ProviderName',
            className: 'text-start fw-bold',
            orderable: false,
          },
          {
            title: this._translateService.instant('TRANSLATE.CUSTOM_OFFERS_ADD_EDIT_FORM_LABEL_CATAGORY'),
            data: 'CategoryName',
            className: 'text-start',
            orderable: false,
          },
        ],
        order:[]
      };
    });
  }

  updateContractOfferStatus(product: any) {
    this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.CONTRACT_PRODUCT_MANAGE_DEACTIVATE_POPUP_CONFIRMATION_TEXT') }).then((result) => {
      if (result.isConfirmed) {
        this.readyToComplete = false;
        const subscription = this._productService.deactivateProduct(product).pipe(takeUntil(this.destroy$)).subscribe(
          {
            next: (res: any) => {
              // this._router.navigate(['customer/products']);
              //this._cdref.detectChanges();
              this.readyToComplete = true;
              localStorage.removeItem("product");
              this._router.navigate([`customer/products`]).then(() => {
              });
            },
            error: (err: any) => {
              this.readyToComplete = true;
            }
          });
          this._subscriptionArray.push(subscription);
      }
    });
  }

  goToProductsPage() {
    this._router.navigate(['customer/products'])
  }

  readMoreDescription() {
    this.showCompleteDescription = true;
  }

  readLessDescription() {
    this.showCompleteDescription = false;
  }

  updateProductName(product: any, attribute, value) {
    if (product.ProductNameToUpdate.length < 2 || product.ProductNameToUpdate.length > 200) {
      this._toastService.error(this._translateService.instant('TRANSLATE.NOTIFIER_ERROR_CHARACTER_LENGTH_ERROR'));
      this._router.navigate([this._router.url]);
      return;
    }
    let entityName = this._commonService.entityName
    let inputForPopup = null;
    let translateValue = null;
    if (entityName == "Customer") {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_UPDATE_SITE_DEPARTMENT_NAME')
      if (this.sites.length == 0) {
        inputForPopup = "";
        translateValue = "";
      }
    }
    else if (entityName == "Site") {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_UPDATE_SITE_DEPARTMENT_NAME');
      if (this.departments.length == 0) {
        inputForPopup = "";
        translateValue = "";
      }
    }
    else if (entityName == "SiteDepartment") {
      inputForPopup = "";
      translateValue = "";
    }
    else {
      inputForPopup = "checkbox";
      translateValue = this._translateService.instant('CUSTOMER_PRODUCT_MANAGE_CONFIRMATION_POPUP_CHANGE_NAME_CONFIRMATION_TEXT');
    }
    const reqBody: any = {};
    reqBody[attribute] = value;
    const confirmationMessage = this._translateService.instant('TRANSLATE.CONFIRMATION_TEXT_PRODUCTS_POPUP_UPDATE_SUBSCRIPTION_NAME');
    Swal.fire({
      icon: 'warning',
      title: confirmationMessage,
      input: inputForPopup,
      inputValue: false,
      inputPlaceholder:translateValue,
      showCancelButton: true,
      confirmButtonText:this._translateService.instant('TRANSLATE.BUTTON_TEXT_OK'),
      cancelButtonText: this._translateService.instant('TRANSLATE.BUTTON_TEXT_CANCEL'),
      confirmButtonColor: 'green'
    }).then((result: { isConfirmed: any, isDenied : any, isDismissed : boolean, value? : number }) => {
      if (result.isConfirmed) {
        let isChecked = 0;
        if (inputForPopup !== '' && translateValue !== '') {
          isChecked = result.value
        }
        if (!reqBody.Name) {
          this._toastService.error(this._translateService.instant('TRANSLATE.MANAGE_NAME_CHANGE_ERROR'));
          this.product.ProductSubscriptionName = this.product.OldProductName;
          return;
        } else {
          reqBody.Name = this.product.ProductNameToUpdate;
          this.product.ProductSubscriptionName = this.product.ProductNameToUpdate;
          const reqModel = {
            ProductId: this.product.InternalCustomerProductId,
            ProductItem: JSON.stringify(this.product),
            Name: reqBody.Name,
            ProviderProductId: this.product.ProviderProductId,
            IsUpdateSiteAndDeptSubscriptionName: Boolean(isChecked)
          };
          const subscription = this._manageProduct.updateProductName(product.InternalCustomerProductId, reqModel).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: any) => {
              this._toastService.success(this._translateService.instant('TRANSLATE.NOTIFICATION_PRODUCT_NAME_CHANGED_SUCCESSFULLY'));
              //this.getProductDetails(product);
            },
            error: (error: any) => {
            }
          });
          this._subscriptionArray.push(subscription);
        }
      }
      else {
        this._router.navigate([this._router.url]);
      }
    })
  }
  setProductName() {
    if (this.product.ProductNameToUpdate?.length < 1 || !this.product.ProductNameToUpdate) {
      this.product.ProductNameToUpdate = this.product.ProductSubscriptionName;
    }
  }

  getSites() {
    if (this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_CUSTOMER ||
      this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_PARTNER ||
      this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_RESELLER) {
      const subscription = this._commonService.getSites().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.sites = response.Data;
      })
      this._subscriptionArray.push(subscription);
    }
  }

  getDepartments() {
    if (this._commonService.entityName.toLocaleLowerCase() == this.cloudHubConstants.ENTITY_SITE) {
      const subscription = this._commonService.getDepartments().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
        this.departments = response.Data;
      })
      this._subscriptionArray.push(subscription);
    }
  }

  onCaptureEvent(event: Event) { }

  ngOnDestroy(): void {
    this._subscription?.unsubscribe();
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }
}
