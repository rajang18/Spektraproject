import { Component, EventEmitter, Input, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from '../../c3-table/c3-table-utils';
import { C3TableComponent } from "../../c3-table/c3-table.component";
import { ProductMappingService } from 'src/app/modules/partner/prod-mapping/services/productmapping.service';
import { CommonModule } from '@angular/common';
import _ from 'lodash';
import { debounceTime, Subject, Subscription, takeUntil } from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@Component({
  selector: 'app-purchase-product-mapping-psa-customer-popup',
  standalone: true,
  imports: [C3TableComponent,
    TranslateModule,
    CommonModule,
    FormsModule,
    InfiniteScrollModule

  ],
  templateUrl: './purchase-product-mapping-psa-customer-popup.component.html',
  styleUrl: './purchase-product-mapping-psa-customer-popup.component.scss'
})
export class PurchaseProductMappingPSACustomerPopupComponent implements OnDestroy{
  activeEntitiesDatatableConfig: ADTSettings;
  slabProductsDatatableConfig: ADTSettings;
  psaCustomer: any;
  selectedPSACustomer: any = [];
  name: string = '';
  activeExternalCustomers: any = [];
  @Input() purchasedProductMapping: any;
  @Input() activeServiceDetail: any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  // @Input() public product: any;
  // @Input() public currencyCode: any;
  @ViewChild('radioButton') radioButton: TemplateRef<any>;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();

  private keyPressSubject: Subject<string> = new Subject<string>(); 

  constructor(
    private _modalService: NgbModal,
    private _commonService: CommonService,
    private _translateService: TranslateService,
    private _productMappingService: ProductMappingService,
    private _notifierService:NotifierService,
    private _ngbactiveModal: NgbActiveModal,
    private _appService: AppSettingsService,  
  ) {
    const subscription = this.keyPressSubject.pipe(
      debounceTime(500)).pipe(takeUntil(this.destroy$)).subscribe((value: string) => {
        this.reloadEvent.emit(true);// Perform any action here
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    this.purchasedProductMapping = this.purchasedProductMapping;
    this.activeServiceDetail = this.activeServiceDetail;
    this.getPSACustomersData();
  }

  getPSACustomersData() {
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
            entityName: this._commonService.entityName,
            recordId: this._commonService.recordId,
            StartInd,
            CustomerName: this.name,
            SortColumn,
            SortOrder,
            PageSize:length,
            EndInd
          }

          const subscription = this._productMappingService.getActiveEntites(searchParams)
          .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {

              let recordsTotal = 0;
              this.activeExternalCustomers = Data;
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
                if (this.purchasedProductMapping.ExternalCustomerId != null || this.purchasedProductMapping.ExternalCustomerId != undefined) {
                  let index = this.activeExternalCustomers.find(e => e.Id == this.purchasedProductMapping.ExternalCustomerId);
                  this.selectedPSACustomer = index;
                  Data = Data.map((elm: any) =>({     
                    ...elm,
                    selectedPSACustomer: elm.Id == this.purchasedProductMapping.ExternalCustomerId          
                  })) 
                }
              }
              callback({
                data: Data,
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        ordering: false,
        columns: [
          {
            className: 'col-md-12',
            defaultContent: '',
            ngTemplateRef: {
              ref: this.radioButton,
              context: {
                // needed for capturing events inside <ng-template>
                captureEvents: self.onCaptureEvent.bind(self),
              },
            },
            orderable: false,
            searchable: false
          }
        ],
      };
    });
  }

  closeModalPopup() {
    //this.activeModal.close();
    this._modalService.dismissAll();
  }

  updateSelectedList(item: any) {
    this.selectedPSACustomer = _.filter(this.activeExternalCustomers, (td: any) => {
      return td.Id == item.Id;
    });
  }

  onNameChange(event: KeyboardEvent): void{
    const input = (event.target as HTMLInputElement).value;
    this.keyPressSubject.next(input); // Emit the current value to the Subject
  }

  Submit() {
    if(this.selectedPSACustomer == 0){
      this._notifierService.confirm({title:this._translateService.instant('TRANSLATE.MAPPING_WARNING_TEXT_NO_PSA_CUSTOMER_IS_SELECTED')})
    }else{
    let resultData = this.selectedPSACustomer;
    this._ngbactiveModal.close(resultData);
   // this.sendResultData.emit(resultData);
    }
  }

  onCaptureEvent(event: Event) { }


  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
