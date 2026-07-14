import { Component, EventEmitter, Input, input, OnDestroy, TemplateRef,ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { ProductMappingService } from 'src/app/modules/partner/prod-mapping/services/productmapping.service';
import { CommonModule } from '@angular/common';
import _ from 'lodash';
import { debounceTime, Subject, Subscription, takeUntil } from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { IntegrationCenterService } from '../../../integration-center.service';

@Component({
  selector: 'app-integration-company-mapping-popup',
  standalone: true,
  imports: [C3TableComponent,TranslateModule,CommonModule,FormsModule],
  templateUrl: './company-mapping-popup.component.html',
  styleUrl: './company-mapping-popup.component.scss'
})
export class IntegrationCompanyMappingPopupComponent implements OnDestroy{
   activeEntitiesDatatableConfig: ADTSettings;
    slabProductsDatatableConfig: ADTSettings;
    selectedCompany: any = [];
    name: string = '';
    selectedCompanyId: any = null;
    activeExternalCustomers: any = [];
    isLoading: boolean = true; 
    @Input() purchasedProductMapping: any;
    // @Input() activeServiceDetail: any;
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
    private integrationCenterService: IntegrationCenterService,
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
    this.selectedCompanyId = this.purchasedProductMapping?.BusinessCentralCompanyId || null;
    this.getActiveCompanies();
  }

  getActiveCompanies() {
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
            CompanyName: this.name,
            SortColumn,
            SortOrder,
            PageSize:length,
            EndInd
          }

        const subscription = this.integrationCenterService.getActiveCompaniesForBusinessCentral(searchParams).pipe(takeUntil(this.destroy$)).subscribe({
          next: ({ Data }: any) => {

          let recordsTotal = 0;
          this.activeExternalCustomers = Data;

          // if (!this.selectedCompanyId && this.purchasedProductMapping?.ExternalCustomerId) {
          //   this.selectedCompanyId = this.purchasedProductMapping.ExternalCustomerId;
          // }

          if (this.selectedCompanyId) {

            const found = Data.find(
              (e: any) =>
                e.BusinessCentralCompanyId === this.selectedCompanyId
            );

            if (found) {
              this.selectedCompany = [found];
            }
          }

          if (Data.length > 0) {
            [{ TotalRows: recordsTotal }] = Data;
          }

          this.isLoading = false; 
          callback({
            data: Data,
            recordsTotal: recordsTotal || 0,
            recordsFiltered: recordsTotal || 0,
          });
        },
        error: () => {
          this.isLoading = false;
          callback({
            data: [],
            recordsTotal: 0,
            recordsFiltered: 0,
          });
        }
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
      this.selectedCompanyId = item.BusinessCentralCompanyId;
      this.selectedCompany = [item];
    }
  
    onNameChange(event: KeyboardEvent): void{
      const input = (event.target as HTMLInputElement).value;
      this.keyPressSubject.next(input); // Emit the current value to the Subject
    }
  
    Submit() {
      if (!this.selectedCompany) {        
        this._notifierService.confirm({title:this._translateService.instant('TRANSLATE.BUSINESS_CENTRAL_SELECTED_COMPANY_MAPPING_WARNING_TEXT')})
      }
      else{
      let resultData = this.selectedCompany;
      this._ngbactiveModal.close(resultData);
     // this.sendResultData.emit(resultData);
      }
    }
  
    onCaptureEvent(event: Event) { }

  ngOnDestroy(){
this._subscriptionArray?.forEach((sb) => sb.unsubscribe());  }

}
