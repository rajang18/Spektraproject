import { Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@Component({
  selector: 'app-purchase-product-mapping-customer-name-pop-up',
  standalone: true,
  imports: [C3TableComponent,
    TranslateModule,
    CommonModule,
    FormsModule,
    InfiniteScrollModule

  ],
  templateUrl: './purchase-product-mapping-customer-name-pop-up.component.html',
  styleUrl: './purchase-product-mapping-customer-name-pop-up.component.scss'
})
export class PurchaseProductMappingCustomerNamePopUPComponent implements OnInit,OnDestroy {
  activeEntitiesDatatableConfig: ADTSettings;
  slabProductsDatatableConfig: ADTSettings;
  psaCustomer: any;
  selectedCustomer: any = [];
  activeCustomers: any = [];
  name: string = '';
  @Input() purchasedProductMapping: any;
  // @Input() public product: any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();

  @ViewChild('radioButton') radioButton: TemplateRef<any>;
  _subscription: Subscription;
  private keyPressSubject: Subject<string> = new Subject<string>(); 
  constructor(
    private _modalService: NgbModal,
    private _translateService: TranslateService,
    private _productMappingService: ProductMappingService,
    private _ngbactiveModal: NgbActiveModal,
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
    this.purchasedProductMapping = this.purchasedProductMapping;
    this.getC3CustomersData();
  }

  getC3CustomersData() {
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
            Name: this.name,
            SortColumn,
            SortOrder,
            PageSize: length,
            EndInd
          }
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productMappingService.getActiveC3Customers(searchParams)
          .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              this.activeCustomers = Data;

              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;

                if (this.purchasedProductMapping.CustomerId != null || this.purchasedProductMapping.CustomerId != undefined) {
                  let index = this.activeCustomers.find(e => e.ID == this.purchasedProductMapping.CustomerId);
                  this.selectedCustomer = index;
                  Data = Data.map((elm: any) => ({
                    ...elm,
                    selectedCustomer: elm.C3Id ===  this.purchasedProductMapping.C3Id
                  }));
                  this.selectedCustomer = _.find(this.activeCustomers, (e: any) => { e.C3Id ===  this.purchasedProductMapping.C3Id });
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

  updateSelectedList(item: any) {
    item.IsSelected = true;
    this.selectedCustomer = _.filter(this.activeCustomers, (td: any) => {
      return td.C3Id == item.C3Id;
    });
    this.selectedCustomer.IsChecked = true
  }

  Submit() {
    if (this.selectedCustomer == 0) {
      this._notifierService.confirm({ title: this._translateService.instant('TRANSLATE.MAPPING_WARNING_TEXT_NO_CUSTOMER_IS_SELECTED') })
    } else {
      let resultData = this.selectedCustomer;
      this._ngbactiveModal.close(resultData);
      // this.sendResultData.emit(resultData);
    }
  }

  closeModalPopup() {
    //this.activeModal.close();
    this.selectedCustomer = null;
    this._modalService.dismissAll();
  }

  onNameChange(event: KeyboardEvent): void {
    const input = (event.target as HTMLInputElement).value;
    this.keyPressSubject.next(input); // Emit the current value to the Subject
  }
  onCaptureEvent(event: Event) { }


  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
