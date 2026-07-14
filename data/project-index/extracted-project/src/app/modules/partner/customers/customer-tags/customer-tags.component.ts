import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalOptions, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { CustomerTagsService } from 'src/app/modules/partner/customers/services/customer-tags.service';
import { ToastService } from 'src/app/services/toast.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-customer-tags',
  standalone: true,
  imports: [C3TableComponent,CommonModule,TranslateModule, NgbTooltipModule,C3CommonModule],
  templateUrl: './customer-tags.component.html',
  styleUrl: './customer-tags.component.scss'
})
export class CustomerTagsComponent extends C3BaseComponent implements OnInit, OnDestroy,AfterViewInit {
  datatableConfig: ADTSettings | any;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditing: boolean[] = [];
  c3Id: string | null;
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  customerName: any;
  HasAddOrEditUserTags:any;
  HasDeleteUserTag:any;

  constructor(
    private customerTagsService: CustomerTagsService,
    private toastService: ToastService,
    private cdRef: ChangeDetectorRef,
    public _router: Router,
    private pageInfo:PageInfoService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService,
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    private _appService: AppSettingsService, 
    private c3RouterService:C3RouterService,
  ) {
    super(_permissionService, _dynamicTemplateService, _router, _appService)
    this.navigation = this._router.getCurrentNavigation();
    this.c3Id = this.navigation?.extras.state?.['c3Id'];
    if(this.c3Id == undefined || this.c3Id == null || this.c3Id == ''){
      this._router.navigate([`partner/customers`]);
    }
    this.customerName = this.navigation?.extras.state?.['Name'];
    if (this.customerName === undefined || this.customerName === null || this.customerName === '') {
      _router.navigate(['partner/customers']);
    }
  }

  ngOnInit(): void {
    this.handleTableConfig();
    this.HasAddOrEditUserTags = this._permissionService.hasPermission(this.cloudHubConstants.ADD_OR_UPDATE_TAGS);
    this.HasDeleteUserTag = this._permissionService.hasPermission(this.cloudHubConstants.DELETE_TAGS);
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    let title: string = this._translateService.instant('TRANSLATE.TAGS_CAPTION_TEXT_TAGS_FOR');
    title= title+`<span class="text-primary">${this.customerName}</span>`
    this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT','PARTNER_DASHBOARD_CUSTOMER_TILE_INTRO_TITLE','CUSTOMER_SUBSCRIPTIONS_TABLE_TD_BUTTON_TOOLTIP_TEXT_DEFINE_TAGS']);
    this.pageInfo.updateTitle(title, true);
  }


  handleTableConfig() {
    const self = this;
    const customerC3Id = this.c3Id;
    this._subscription = this.customerTagsService.getList({
      customerC3Id,
    }).pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      setTimeout(() => {
        this.applyEscapeHTML(Data)
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
          data: Data,
          ADTSettings: {
            enableEscapeHTML: true
          },
          columns: [
            {
              title: this._translateService.instant('TRANSLATE.CUSTOMER_TAGS_TABLE_HEADER_TEXT_NAME'),
              data: 'TagKey',
              className:'col-md-4 body-alignment-normal',
              render: (data: string, type: any, row: any, meta: any) => {
                return '<span class="fw-semibold">' + data + '</span>';
              }
            },
            {
              title: this._translateService.instant('TRANSLATE.CUSTOMER_TAGS_TABLE_HEADER_TEXT_VALUE'),
              data: 'TagValue',
              className:'col-md-5 body-alignment-normal',
            },
            {
              title: this._translateService.instant('TRANSLATE.CUSTOMER_TAGS_TABLE_HEADER_TEXT_ACTIONS'),
              defaultContent: '',
              className:'col-md-3 body-alignment-normal',
              orderable:false,
              visible:  this.HasDeleteUserTag.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase() && this.HasAddOrEditUserTags.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase(),
              type: 'string',
              ngTemplateRef: this.HasDeleteUserTag.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase() && this.HasAddOrEditUserTags.toLowerCase() === this.cloudHubConstants.ACCESS_TYPE_ALLOWED.toLowerCase() ? {
              ref: this.actions,
              } : null,
            },
          ],
        };
        this.cdRef.detectChanges();
      });
    });
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  addTags(){
    this._router.navigate([`partner/customers/${this.c3Id}/addTags`],{state: {keyForData:this.keyForData,c3Id:this.c3Id, customerName:this.customerName, pageMode: 'add'}})
  }

  editTag(data:any){
    this._router.navigate([`partner/customers/${this.c3Id}/addTags`],{state: {keyForData:this.keyForData,c3Id:this.c3Id,tagDetails:data, customerName : this.customerName, pageMode: 'edit'}})
  }

  backToCustomers(){
    this.c3RouterService.backToHistory(this.keyForData,'partner/customers');
  }

  deleteCustomerTag(data:any){
    const params = {
       C3Id: this.c3Id,
       TagId:data.TagId
    }
    const confirmationText = this._translateService.instant('TRANSLATE.POPUP_DELETE_SUB_HEADER_TEXT');
        this._notifierService.confirm({title:confirmationText}).then((result: { isConfirmed: any;}) =>{
          /* Read more about isConfirmed */ 
          if(result.isConfirmed){
            this.customerTagsService.deleteTag(params)
            .pipe(
              takeUntil(this.destroy$),
              switchMap(response => {
                const customerC3Id = this.c3Id;
                return this.customerTagsService.getList({ customerC3Id });
              })
            )
            .subscribe({
              next: ({ Data }: any) => {
                this.datatableConfig.data = Data;
                this.reloadEvent.emit(true);
                this.toastService.success(this._translateService.instant('TRANSLATE.NOTIFICATION_CUSTOMER_TAG_DELETED_SUCCESSFULLY_MESSAGE'));
              },
              error: (err) => {
                console.error('Error fetching updated data:', err);
              }
            });
          
          }
        })
    
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }


}
