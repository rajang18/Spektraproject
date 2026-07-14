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
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/services/app-settings.service';

@Component({
  selector: 'psa-customer',
  standalone: true,
  imports: [C3TableComponent,
    TranslateModule,
    CommonModule,
    FormsModule

  ],
  templateUrl: './psa-customer.component.html',
  styleUrl: './psa-customer.component.scss'
})
export class PurchaseProductMappingPSACustomerPopupComponent implements OnDestroy {

  activeEntitiesDatatableConfig: ADTSettings;
  slabProductsDatatableConfig: ADTSettings;
  psaCustomer: any;
  selectedPSACustomer: any;
  name: string = '';
  activeExternalCustomers: any = [];
  @Input() purchasedProductMapping: any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  // @Input() public product: any;
  // @Input() public currencyCode: any;
  @ViewChild('radioButton') radioButton: TemplateRef<any>;
  _subscription: Subscription;
  destroy$ = new Subject<void>();
  public _subscriptionArray: Subscription[] = []; 

  constructor(
    private _modalService: NgbModal,
    private _translateService: TranslateService,
    private _productMappingService: ProductMappingService,
    private _ngbactiveModal : NgbActiveModal,
    private _appService: AppSettingsService,
  ) {

  }

  ngOnInit(): void {
    this.purchasedProductMapping = this.purchasedProductMapping;
    this.getPSACustomersData();
  }

  getPSACustomersData() {
    setTimeout(() => {
      const self = this;
      this.activeEntitiesDatatableConfig = {
        serverSide: true,
        pageLength: (this._appService.$rootScope.DefaultPageCount || 10),
        ajax: (dataTablesParameters: any, callback: any) => {
          const { StartInd, Name, SortColumn, SortOrder,PageSize, EndInd } =
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
            PageSize,
            EndInd
          }
           
          this._subscription && this._subscription?.unsubscribe();
          const subscription = this._productMappingService.getActiveEntites(searchParams)
          .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
               
              let recordsTotal = 0;
              if (Data.length > 0) {
                recordsTotal = Data[0].TotalRows;
                this.activeExternalCustomers = Data;
              }
              callback({
                data: (Data.slice((StartInd - 1) * 10, StartInd * 10)),
                recordsTotal: recordsTotal || 0,
                recordsFiltered: recordsTotal || 0,
              });
            });
            this._subscriptionArray.push(subscription);
        },
        ordering:false,
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
            orderable:false,
            searchable:false
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

  onNameChange(){
    this.reloadEvent.emit(true);
  }

  Submit() {
    let resultData = this.selectedPSACustomer;
    this._ngbactiveModal.close(resultData);
   // this.sendResultData.emit(resultData);
  }

  onCaptureEvent(event: Event) { }


  ngOnDestroy() {
    this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
  }

}
