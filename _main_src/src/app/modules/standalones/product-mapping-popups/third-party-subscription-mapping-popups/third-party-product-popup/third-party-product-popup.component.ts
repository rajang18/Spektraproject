import { Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ReportPopupConfig } from 'src/app/shared/models/report-popup.model';
import { ProductMappingService } from 'src/app/modules/partner/prod-mapping/services/productmapping.service';
import { CommonModule } from '@angular/common';
import { CommonService } from 'src/app/services/common.service';
import _ from 'lodash';
import { C3TableComponent } from '../../../c3-table/c3-table.component';
import { mapParamsWithApi } from '../../../c3-table/c3-table-utils';
import { debounceTime, Subject, Subscription, takeUntil } from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';


@Component({
  selector: 'app-third-party-subscription-product-popup-component',
  standalone: true,
  imports: [C3TableComponent,
    TranslateModule,
    CommonModule,
    FormsModule,
    InfiniteScrollModule

  ],
  templateUrl: './third-party-product-popup.component.html',
  styleUrl: './third-party-product-popup.component.scss'
})
export class ThirdPartySubscriptionProductPopupComponentComponent implements OnInit, OnDestroy {
  activeEntitiesDatatableConfig: ADTSettings;
  c3productDatatableConfig: ADTSettings;
  psaCustomer: any;
  selectedPSAProduct: any = [];
  name: string = '';
  activeExternalProducts: any = [];
  selectedCustomerId: any;
  isProductSelectedBefore : boolean = false;
  @Input() activeServiceDetails: any;
  @Input() c3Product: any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  // @Input() public currencyCode: any;
  @ViewChild('radioButton') radioButton: TemplateRef<any>;
  _subscription: Subscription;
  private keyPressSubject: Subject<string> = new Subject<string>(); 
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();


  constructor(
    private _modalService: NgbModal,
    private _translateService: TranslateService,
    private _productMappingService: ProductMappingService,
    private _ngbactiveModal: NgbActiveModal,
    private _commonService: CommonService,
    private _notifierService: NotifierService,
    private _appService: AppSettingsService,  
  ) {
    const subscription = this.keyPressSubject.pipe(
      debounceTime(1000)).pipe(takeUntil(this.destroy$)).subscribe((value: string) => {
        this.reloadEvent.emit(true);// Perform any action here
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    this.activeServiceDetails = this.activeServiceDetails;
    this.c3Product = this.c3Product;
    this.productsTableData();
  }

  productsTableData() {
    setTimeout(() => {
      const self = this;
      this.c3productDatatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder, PageSize, EndInd } =
            mapParamsWithApi(dataTablesParameters);
          let nameFilter = Name;
          if (nameFilter === null || nameFilter === undefined || nameFilter === '') {
            nameFilter = Name
          }
          const searchParams = {
            entityName: this._commonService.entityName,
            recordId: this._commonService.recordId,
            ExternalServiceName: this.activeServiceDetails.Name,
            Name: this.name,
            StartInd,
            PageSize,
            EndInd,
            SortOrder: "ASC",
            SortColumn: "Name"
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productMappingService.getActiveExternalProducts(searchParams)
          .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
               
              let recordsTotal = 0;
              this.activeExternalProducts = Data;
              if (Data.length > 0) {
                recordsTotal = Data[0].TotalRows;
                if (this.c3Product.MappedExternalProductId != null || this.c3Product.MappedExternalProductId != undefined) {
                  var index = this.activeExternalProducts.find(e => e.Id == this.c3Product.MappedExternalProductId);
                  //this.activeExternalProducts[index].Ischecked = true;
                  this.isProductSelectedBefore = true;
                  this.selectedPSAProduct = index;
                  Data = Data.map((elm: any) =>({     
                    ...elm,
                    selectedPSAProduct: elm.Id === this.c3Product.MappedExternalProductId         
                  })) 
                }
              //   if (this.c3Product.MappedExternalProductId != null || this.c3Product.MappedExternalProductId != undefined) {
              //     var index = this.activeExternalProducts.find(e => e.Id == this.c3Product.MappedExternalProductId);
              //     //this.activeExternalProducts[index].Ischecked = true;
              //     this.selectedPSAProduct = index;
              // }
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

  onNameChange(event: KeyboardEvent): void {
    const input = (event.target as HTMLInputElement).value;
    this.keyPressSubject.next(input); // Emit the current value to the Subject
  }

  closeModalPopup() {
    //this.activeModal.close();
    if(!this.isProductSelectedBefore){
      this.c3Product.ContractServiceId = null;
      this.c3Product.ContractServiceName = null;
    }
    this._modalService.dismissAll();

  }

  updateSelectedList(item: any) {
    item.IsSelected = true;
    this.selectedPSAProduct = _.filter(this.activeExternalProducts, function (td) {
      return td.Id == item.Id;
    });
    this.c3Product.MappedExternalProductId = item.Id
    this.c3Product.MappedExternalProductName = this.selectedPSAProduct[0].Name;
  }

  Submit() {
    if (this.c3Product.MappedExternalProductName == null) {
      this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.MAPPING_WARNING_TEXT_NO_PSA_PRODUCT_IS_SELECTED') })
    } else {
      let resultData = this.c3Product;
      this._ngbactiveModal.close(resultData);
      // this.sendResultData.emit(resultData);
    }
  }
  onCaptureEvent(event: Event) { }

  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }


}

