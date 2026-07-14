import { ChangeDetectorRef, Component, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { interval, Subscription, switchMap, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { ManageProductService } from 'src/app/services/manage-product.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss'
})
export class ManageProductsCommentsComponent extends C3BaseComponent {
  product: any;
  isCustomerAllowedToReduceSeats: any;
  isManagedByPartnerInPurchasedProducts: any;
  saveModel = {
    EntityName: null,
    RecordId: null,
    Content: null,
    CreateBy: null
  }
  CustomerProducts: any;
  Content = null;
  commentsTable = null;
  dateTimeFormat = "";
  datatableConfig: ADTSettings;
  timerHandle: Subscription;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditing: boolean[] = [];
  c3Id: string | null;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };




  constructor(
    private _manageProduct: ManageProductService,
    private _cdref: ChangeDetectorRef,
    private _translateService: TranslateService,
    private pageInfo: PageInfoService,
    public _router: Router,
    public _toastService: ToastService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService);
    if (localStorage.getItem("product") !== undefined || localStorage.getItem("product") !== null || localStorage.getItem("product") !== "") {
      this.product = JSON.parse(localStorage.getItem("product"));
      this.CustomerProducts = this.product;
      this.isCustomerAllowedToReduceSeats = this.product.IsCustomerAllowedToReduceSeats;
      this.isManagedByPartnerInPurchasedProducts = this.product.IsManagedByPartnerInPurchasedProducts;
    }
    else {
      this.goToProductsPage();
    }
  }

  ngOnInit(): void {
    this.pageInfo.updateBreadcrumbs(['BREADCRUMB_TEXT_CUSTOMER_PRODUCTS'])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_ONLINE_SERVICE_TITTLE"),true);
      this.dateTimeFormat = this._appService.$rootScope.oldDateTimeFormat;
    this.handleTableConfig();
    this.pollComments();
  }

  goToProductsPage() {
    this._router.navigate(['customer/products']);
  }

  
  handleTableConfig() {
    const self = this;
    setTimeout(() => {
      this.datatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 50),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder,  } =
            mapParamsWithApi(dataTablesParameters);
          this._subscription && this._subscription?.unsubscribe();
          let requestBody = {
            EntityName: "CustomerProduct",
            RecordId: this.CustomerProducts.ProductSubscriptionId,
            StartInd: StartInd,
            PageSize: 10000,
          }
          const subscription = this._manageProduct
            .getComments(requestBody).pipe(takeUntil(this.destroy$))
            .subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
              }
              Data.map((e) => {
                e.toggleDetails = false;
                e.Replies = JSON.parse(e.Replies);
              });
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        paging: false,
        language: {
          info: "", // Hide the information text
          infoEmpty: "", // Hide information when no records are present
          infoFiltered: "" // Hide information about filtering
      },
        columns: [
          {

            defaultContent: '',
            className: 'col-md-12',
            ngTemplateRef: {
              ref: this.actions,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
          },
        ],
        order: []
      };
      this._cdref.detectChanges();
    });
  }
  onCaptureEvent(event: Event) { }

  saveComments() {
    this.saveModel.EntityName = "CustomerProduct";
    this.saveModel.RecordId = this.CustomerProducts.ProductSubscriptionId;
    this.saveModel.Content = this.Content;
    if(!this.saveModel?.Content || this.saveModel.Content.trim() === '') {

      this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_EMPTY_COMMENTS_SUBMITTED'));

    } else {
      const subscription = this._manageProduct.saveComments(this.saveModel).pipe(takeUntil(this.destroy$)).subscribe(response => {
      this.Content = null;
      this.reloadEvent.emit(true);
    })
    this._subscriptionArray.push(subscription);
  }

  }
  pollComments(){
    const subscription = interval(15000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        this.reloadEvent.emit(true);
        return [];
      })
    ).subscribe();
    this._subscriptionArray.push(subscription);
  }
  ngOnDestroy(): void {
    if(this.timerHandle){
      this.timerHandle.unsubscribe();
      this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    }
  }
}
