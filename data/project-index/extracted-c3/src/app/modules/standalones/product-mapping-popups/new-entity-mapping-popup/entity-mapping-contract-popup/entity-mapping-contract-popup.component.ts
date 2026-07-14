import { Component, EventEmitter, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ProductMappingService } from 'src/app/modules/partner/prod-mapping/services/productmapping.service';
import { CommonModule } from '@angular/common';
import { CommonService } from 'src/app/services/common.service';
import _ from 'lodash';
import { debounceTime, Subject, Subscription, takeUntil } from 'rxjs';
import { C3TableComponent } from '../../../c3-table/c3-table.component';
import { mapParamsWithApi } from '../../../c3-table/c3-table-utils';
import { NotifierService } from 'src/app/services/notifier.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';


@Component({
  selector: 'app-entity-mapping-contract-popup',
  standalone: true,
  imports: [C3TableComponent,
    TranslateModule,
    CommonModule,
    FormsModule,
    NgbModule,
    InfiniteScrollModule

  ],
  templateUrl: './entity-mapping-contract-popup.component.html',
  styleUrl: './entity-mapping-contract-popup.component.scss'
})
export class EntityMappingContractPopupComponent implements OnInit, OnDestroy {
  activeEntitiesDatatableConfig: ADTSettings;
  contractDatatableConfig: ADTSettings;
  agreements: any = [];
  selectedContract: any= [];
  selectedCustomerId: any;
  name: string = '';
  _subscription: Subscription;
  private keyPressSubject: Subject<string> = new Subject<string>(); 
  @Input() purchasedProductMapping: any;
  @Input() c3Customers: any;
  @Input() activeServiceDetail:any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  // @Input() public product: any;
  // @Input() public currencyCode: any;
  @ViewChild('radioButton') radioButton: TemplateRef<any>;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();


  constructor(
    private _modalService: NgbModal,
    private _translateService: TranslateService,
    private _productMappingService: ProductMappingService,
    private _ngbactiveModal: NgbActiveModal,
    private _commonService: CommonService,
    private _notifierService:NotifierService,
    private _appService: AppSettingsService,
  ) {
    const subscription = this.keyPressSubject.pipe(
      debounceTime(1000),takeUntil(this.destroy$)).subscribe((value: string) => {
        this.reloadEvent.emit(true);// Perform any action here
    });
    this._subscriptionArray.push(subscription);
  }

  ngOnInit(): void {
    this.purchasedProductMapping = this.purchasedProductMapping;
    this.c3Customers = this.c3Customers;
    this.contractsData();
  }

  contractsData() {
    setTimeout(() => {
      const self = this;
      this.contractDatatableConfig = {
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
            customerId: this.purchasedProductMapping.ExternalCustomerId,
            Name: this.name,
            StartInd,
            PageSize: length,
            EndInd,
            SortOrder: "Name",
            SortColumn: "ASC"
          }

          this._subscription && this._subscription?.unsubscribe();
          const subscription =  this._productMappingService.getActiveContracts(searchParams)
            .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
              let recordsTotal = 0;
              this.agreements = Data || []
              if (Data.length > 0) {
                [{ TotalRows: recordsTotal }] = Data;
                if (this.purchasedProductMapping.AgreementId != null || this.purchasedProductMapping.AgreementId != undefined) {
                  Data = Data.map((elm: any) =>({     
                    ...elm,
                    selectedContract: elm.Id === this.purchasedProductMapping.AgreementId          
                  })); 
                  this.selectedContract = _.find(this.agreements,(e: any ) => {e.Id == this.purchasedProductMapping.AgreementId});
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
    this.selectedContract = null;
    this._modalService.dismissAll();
  }

  updateSelectedList(item: any) {
    item.IsSelected = true;
    this.selectedContract = _.filter(this.agreements, function (td) {
      return td.Id == item.Id;
    });
  }

  Submit() {
    if(this.selectedContract == 0){
      this._notifierService.confirm({title:this._translateService.instant('TRANSLATE.MAPPING_WARNING_TEXT_NO_AGREEMENT_IS_SELECTED')})
    }else{
    let resultData = this.selectedContract;
    this._ngbactiveModal.close(resultData);
    // this.sendResultData.emit(resultData);
    }
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
