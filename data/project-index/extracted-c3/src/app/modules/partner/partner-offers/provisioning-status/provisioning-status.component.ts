import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import {
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ProvisioningStatusService } from 'src/app/modules/partner/partner-offers/services/provisioning-status.service';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service'; 
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Router } from '@angular/router';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-provisioning-status',
  templateUrl: './provisioning-status.component.html',
  styleUrl: './provisioning-status.component.scss',
})
export class ProvisioningStatusComponent extends C3BaseComponent implements OnInit, OnDestroy {
  datatableConfig: ADTSettings;
  customerImpersonateConfig: ADTSettings;
  isEditing: boolean[] = [];
  // _subscription: Subscription;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  successMessage = 'Customer Name update success';
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  isGridLoading : boolean = false;
  HasPartnerOfferProvisioning:any;
  
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  constructor(
    private _ProvisioningStatusService: ProvisioningStatusService,

    private _cdRef: ChangeDetectorRef,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    private _commonService: CommonService,
    public pageInfo: PageInfoService,
    public _permissionService: PermissionService,
    private router: Router,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService,
  ) {
    super(_permissionService, _dynamicTemplateService, router, _appService)
  }

  ngOnInit(): void {
    // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
    this.handleTableConfig();
    if(this._commonService.entityName == 'Partner'){
      this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL_DIRECT', 'TAB_HEADING_PROVISIONING_STATUS']);
    }
    if(this._commonService.entityName == 'Reseller'){
      this.pageInfo.updateBreadcrumbs(['MENUS_SELL', 'TAB_HEADING_PROVISIONING_STATUS']);
    }

    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.TAB_HEADING_PROVISIONING_STATUS"), true);
    this.HasPartnerOfferProvisioning = this._permissionService.hasPermission(this.cloudHubConstants.UPDATE_PARTNER_OFFER_PROVISIONING_STATUS)
  }

  handleTableConfig() {
    this.isGridLoading = true;
    this.datatableConfig = null;
    const subscription =  this._ProvisioningStatusService
      .getList()
      .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
        this.isGridLoading = false;
        setTimeout(() => {
          const self = this;
          this.datatableConfig = {
            serverSide: false,
            pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
            data: Data,

            columns: [
              {
                className:'col-md-2',
                title: this._translateService.instant('TRANSLATE.SUPPORT_LIST_FORM_LABEL_CUSTOMER'),
                data: 'CustomerName',
                render: function (data: any, type: any, row: any) {
                  return `<span class="fw-semibold">${data}</span>`;
                }
              },
              {
                className:'col-md-2',
                title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_PROVISIONING_TABLE_HEADER_TEXT_SUBSCRIPTION_NAME'),
                data: 'Name'
              },
              {
                className:'col-md-1 pe-2',
                title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_PROVISIONING_TABLE_HEADER_TEXT_OLD_STATUS'),
                data: 'OldStatus',
                orderable: false
              },
              {
                className:'col-md-2 pe-2',
                title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_PROVISIONING_TABLE_HEADER_TEXT_OLD_QUANTITY'),
                data: 'OldQuantity',
                orderable: false
              },
              {
                className:'col-md-1 pe-2',
                title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_PROVISIONING_TABLE_HEADER_TEXT_NEW_STATUS'),
                data: 'NewStatus',
                orderable: false
              },
              {
                className:'col-md-2 pe-2',
                title: this._translateService.instant('TRANSLATE.SUBSCRIPTION_PROVISIONING_TABLE_HEADER_TEXT_NEW_QUANTITY'),
                data: 'Quantity',
                orderable: false
              },
              {
                className:'col-md-2 text-end pe-2',
                title: this._translateService.instant('TRANSLATE.CUSTOMER_TAGS_TABLE_HEADER_TEXT_ACTIONS'),
                defaultContent: '',
                // ngTemplateRef: {
                //   ref: this.actions,
                //   context: {
                //     captureEvents: self.onCaptureEvent.bind(self),
                //   },
                // },
                visible:this.HasPartnerOfferProvisioning === 'Allowed',
                ngTemplateRef: this.HasPartnerOfferProvisioning === 'Allowed' ? {
                  ref: this.actions
                } : null,
                orderable: false
              },
            ],
          };
          this._cdRef.detectChanges();
        });
      });
    this._subscriptionArray.push(subscription);
  }
  
  updateSubscription(CartLineItemId: number, IsActive: boolean) {
    let confirmationText = '';
    let successtext = '';
    if (IsActive) {
      confirmationText = this._translateService.instant(
        'TRANSLATE.PARTNER_PROVISIONING_PAGE_POPUP_CONFIRMATION_POPUP_MESSAGE'
      );
      successtext = this._translateService.instant(
        'TRANSLATE.SUBSCRIPTION_PROVISIONING_ACTIVATE_SUCCESS'
      );
    } else {
      confirmationText = this._translateService.instant(
        'TRANSLATE.PARTNER_PROVISIONING_PAGE_POPUP_CONFIRMATION_POPUP_MESSAGE_FOR_CANCELLED'
      );
      successtext = this._translateService.instant(
        'TRANSLATE.SUBSCRIPTION_PROVISIONING_CANCELED_SUCCESS'
      );
    }
    this._notifierService.confirm({title:confirmationText, icon: 'info', confirmButtonColor: '#f8285a'}).then((result) => {
      if (result.value) {
        const subscription =  this._ProvisioningStatusService
          .activateSubscription({ CartLineItemId, IsActive })
          .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            if (response.Status == 'Success') {
              this.handleTableConfig();
              this._notifierService.success({title: successtext});
            }
          });
        this._subscriptionArray.push(subscription);
      }
    });
  }
  onCaptureEvent(event: Event) {}

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
