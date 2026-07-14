import { Component, EventEmitter, Input, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { ProductMappingService } from 'src/app/modules/partner/prod-mapping/services/productmapping.service';
import { CommonModule } from '@angular/common';
import _ from 'lodash';
import { debounceTime, Subject, Subscription, takeUntil } from 'rxjs';
import { NotifierService } from 'src/app/services/notifier.service';
import { CommonService } from 'src/app/services/common.service';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3TableComponent } from 'src/app/modules/standalones/c3-table/c3-table.component';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { IntegrationCenterService } from '../../../integration-center.service';

@Component({
  selector: 'app-integration-business-central-customer-mapping-popup',
  standalone: true,
  imports: [TranslateModule,CommonModule,FormsModule,C3TableComponent],
  templateUrl: './ibc-customer-mapping-popup.component.html',
  styleUrl: './ibc-customer-mapping-popup.component.scss'
})
export class IntegrationBusinessCentralCustomerMappingPopupComponent {
 activeEntitiesDatatableConfig: ADTSettings;
  slabProductsDatatableConfig: ADTSettings;
  businessCentralCustomer: any;
  selectedCustomer: any = [];
  name: string = '';
  activeCustomers: any = [];
  companyId : string = '';
  companyName : string = '';
  selectedCustomerId: any = null;
  isLoading: boolean = true;
  @Input() purchasedProductMapping: any;
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('radioButton') radioButton: TemplateRef<any>;
  public _subscriptionArray: Subscription[] = []; 
  destroy$ = new Subject<void>();
  private keyPressSubject: Subject<string> = new Subject<string>(); 
    _subscription: Subscription;
  constructor(private _modalService: NgbModal,
      private _commonService: CommonService,
      private _translateService: TranslateService,
      private integrationCenterService: IntegrationCenterService,
      private _notifierService:NotifierService,
      private _ngbactiveModal: NgbActiveModal,
      private _appService: AppSettingsService,  ){
         const subscription = this.keyPressSubject.pipe(
        debounceTime(500)).pipe(takeUntil(this.destroy$)).subscribe((value: string) => {
          this.reloadEvent.emit(true);// Perform any action here
      });
      this._subscriptionArray.push(subscription);
      }
  
       ngOnInit(): void {
      this.purchasedProductMapping = this.purchasedProductMapping;
      this.selectedCustomerId = this.purchasedProductMapping?.BusinessCentralCustomerId || null;
      this.getBusinessCentralCustomersData();
    }
  
    getBusinessCentralCustomersData(){
  setTimeout(() => {
        const self = this;
        this.activeEntitiesDatatableConfig = {
          serverSide: true,
          ordering: false,
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
              BusinessCentralCompanyId: this.purchasedProductMapping.BusinessCentralCompanyId,
              BusinessCentralCompanyName: this.purchasedProductMapping.BusinessCentralCompanyName,
              BusinessCentralCustomerId : "",
              BusinessCentralCustomerName: this.name,
              SortColumn,
              SortOrder,
              PageSize: length,
              EndInd
            }
            this._subscription && this._subscription?.unsubscribe();
            const subscription = this.integrationCenterService.getActiveBusinessCentralCustomers(searchParams)
              .pipe(takeUntil(this.destroy$)).subscribe({
                next: ({ Data }: any) => {
                  let recordsTotal = 0;
                  this.activeCustomers = Data;
                  if (Data.length > 0) {
                  [{ TotalRows: recordsTotal }] = Data;
                    // if (!this.selectedCustomerId && this.purchasedProductMapping?.BusinessCentralCustomerId) {
                    //   this.selectedCustomerId = this.purchasedProductMapping.BusinessCentralCustomerId;
                    // }

                    if (this.selectedCustomerId) {
                      const found = Data.find((e: any) => e.BusinessCentralCustomerId === this.selectedCustomerId);
                      if (found) {
                        this.selectedCustomer = [found];
                      }
                     }
                }
                this.companyId = this.purchasedProductMapping.BusinessCentralCompanyId;
                this.companyName = this.purchasedProductMapping.BusinessCentralCompanyName;
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
       this.selectedCustomerId = item.BusinessCentralCustomerId;  
       this.selectedCustomer = [item];            
                 
      }
  
     closeModalPopup() {
      this._modalService.dismissAll();
    }
  
    onNameChange(event: KeyboardEvent): void{
      const input = (event.target as HTMLInputElement).value;
      this.keyPressSubject.next(input); // Emit the current value to the Subject
    }
  
      Submit() {
       if (!this.selectedCustomer){
        this._notifierService.confirm({title:this._translateService.instant('TRANSLATE.BUSINESS_CENTRAL_SELECTED_CUSTOMER_MAPPING_WARNING_TEXT')})
      }else{
      let resultData = this.selectedCustomer;
      this._ngbactiveModal.close(resultData);
      }
    }
    onCaptureEvent(event: Event) { }
  
    ngOnDestroy() {
      this.destroy$.next();
      this.destroy$.complete();
      this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    }
  
}
