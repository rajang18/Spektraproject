import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalOptions} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings'; 
import { PageInfoService } from 'src/app/_c3-lib/layout';  
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service'; 
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ToastService } from 'src/app/services/toast.service'; 
import { ProductSequenceService } from '../service/product-sequence.service';
import { FormGroup } from '@angular/forms';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { filter } from 'lodash';
import { CloudHubConstants } from 'src/app/shared/models/constants/cloudHubConstants';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-sequence-list',
  templateUrl: './product-sequence-list.component.html',
  styleUrl: './product-sequence-list.component.scss'
})
export class ProductSequenceListComponent implements OnInit, OnDestroy {
  sequenceForm:FormGroup;
  datatableConfig: ADTSettings;
  // Reload emitter inside datatable
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  isEditing: boolean[] = [];
  updatedproductDetails: any[] = [];
  jsonData:any = null;
  dataLength: number =0;
  productDetails:any;
  isGridDataLoading : boolean;
  userContextList : any;
  selectedUserContext : any = "";
  toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
  @ViewChild('actions') actions: TemplateRef<any>;
  @ViewChild('productSequenceAction') productSequenceAction: TemplateRef<any>;
  @ViewChild('namePills') namePills: TemplateRef<any>;
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };
  _subscription: any;
  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];

  constructor(
    private _productSequenceService: ProductSequenceService,
    private _toastService: ToastService, 
    private cdRef: ChangeDetectorRef, 
    public _router: Router,
    private pageInfo:PageInfoService,
    private _translateService: TranslateService,
    private _notifierService: NotifierService, 
    public _permissionService: PermissionService,
    public _dynamicTemplateService: DynamicTemplateService,
    public _appSettingsService : AppSettingsService
  ) {  }

  ngOnInit(): void {
    this.getUserAssociatedContextList();
    this.handleTableConfig();
  }

  getUserAssociatedContextList(){
    const subscription = this._appSettingsService.getUserContext().pipe(takeUntil(this.destroy$)).subscribe((res: any)=>{
      this.userContextList = res.Data; 
      let userPrimaryContext = filter(this.userContextList,function(userContext){
        return userContext.IsPrimaryContext == true;
      })
      if(userPrimaryContext != null && userPrimaryContext.length > 0){
        this.selectedUserContext = userPrimaryContext[0].UserContext;
      }
      this.selectedUserContext = `<span class="text-primary">${this.selectedUserContext}</span>`
      let title = this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_SEQUENCE_HEADER_TEXT") + " " + this._translateService.instant("TRANSLATE.CUSTOMER_PRODUCT_SEQUENCE_TEXT_FOR") +" : "+ this.selectedUserContext;
      this.pageInfo.updateBreadcrumbs(['CUSTOMER_PRODUCT_SEQUENCE_HEADER_TEXT'])
      this.pageInfo.updateTitle(title,true);
    })
    this._subscriptionArray.push(subscription);
  }

  handleTableConfig() {
    const self = this;
    this.isGridDataLoading = true;
    const subscription = this._productSequenceService.getList().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
      this.dataLength = Data.length;
      this.isGridDataLoading = false;
      this.productDetails = Data;
      setTimeout(() => {
        this.datatableConfig = {
          serverSide: false,
          pageLength: (this._appSettingsService.$rootScope.DefaultPageCount || 10),
          data: Data,
          ordering:false,
          columns: [
            {
              type:'string',
              className:'col-9',
              searchable:true,
              data:'ProductName',
              title: this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_SEQUENCE_TABLE_HEADER_TEXT_PRODUCT_NAME'),
              defaultContent: '',
              ngTemplateRef: {
                ref: this.namePills,
                context: {
                  // needed for capturing events inside <ng-template>
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              },
            },
            {
              type: 'string',
              className: 'col-3',
              title: this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_SEQUENCE_TABLE_HEADER_TEXT_PRODUCT_SEQUENCE'),
              defaultContent: '',
              ngTemplateRef: {
                ref: this.productSequenceAction,
                context: {
                  captureEvents: self.onCaptureEvent.bind(self),
                },
              },
              render: (data: any) => {
                const disabledClass = this.isGridDataLoading ? 'disabled' : '';
                return `<span class="${disabledClass}">${data}</span>`;
              },
            }
          ],
        };
        this.cdRef.detectChanges();
      });
    });
    this._subscriptionArray.push(subscription);
  }
  onCaptureEvent(event: Event) {}
  enableEditField(data: any) {}

  get cloudHubConstants() {
    return CloudHubConstants;
  }

  hasUpdatePermission(): boolean {
    if(this._permissionService.hasPermission('UPDATE_PRODUCT_SEQUENCE').toLowerCase() == this.cloudHubConstants.ACCESS_TYPE_ALLOWED){
      return false;
    }else{
      return true;
    }
  }

  changeSequence(data:any){
    var selctedData  = this.updatedproductDetails.find((v:any) =>v.InternalCustomerProductId == data.InternalCustomerProductId);
    if(selctedData == undefined || selctedData == null){
      this.updatedproductDetails.push(data); 
      this.updatedproductDetails; 
    }
  }

  submit(){
      this.jsonData = JSON.stringify(this.updatedproductDetails);
      let IsNegative = this.updatedproductDetails.find((e) => e.ProductSequence < 0);
      if(IsNegative) {
        this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_PRODUCT_SEQUENCE_DETAILS_ARE_HAVING_INVALID_OR_NEGATIVE_VALUES_MESSAGE'));
      }
      else {
        if(this.updatedproductDetails.length >= 0){
        let confirmationText = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_SEQUENCE_UPDATE_CONFIRMATION');
        this._notifierService.confirm({title:confirmationText,confirmButtonColor:'green'}).then((result: { isConfirmed: any;}) =>{
          if(result.isConfirmed){
            this._subscription = this._productSequenceService.saveCustomerProductSequence(this.jsonData).subscribe( (response:any) =>{//ajmal:todo: Nexted subscription
              if(response.Status == 'Success'){
                this.updatedproductDetails = [];
                this._toastService.success(this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_SEQUENCE_UPDATED'));
                this._subscription = this._productSequenceService.getList().subscribe(({ Data }: any) => {//ajmal:todo: Nexted subscription
                  this.datatableConfig.data = Data;
                  this.reloadEvent.emit(true);
                })
              }
            })
          }
      });
      }
      else{
        this._toastService.error(this._translateService.instant('TRANSLATE.ERROR_PRODUCT_SEQUENCE_DETAILS_ARE_HAVING_INVALID_OR_NEGATIVE_VALUES_MESSAGE'));
      }
    }
}

  cancelProductSequence(){
    const confirmationText = this._translateService.instant('TRANSLATE.CUSTOMER_PRODUCT_SEQUENCE_UPDATE_CANCEL');
    this._notifierService
    .confirm({title: confirmationText, confirmButtonColor : '#17c653'})
    .then((result) => {
      if(result.isConfirmed){
        const subscription = this._productSequenceService.getList().pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
          this.datatableConfig.data = Data;
          this.reloadEvent.emit(true);
        })
        this._subscriptionArray.push(subscription);
      }
    })
    
  }

 ngOnDestroy(): void {
  this._subscription?.unsubscribe();
  this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
 }
}
