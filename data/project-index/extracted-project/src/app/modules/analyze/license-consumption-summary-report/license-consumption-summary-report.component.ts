import {
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  HostListener,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { mapParamsWithApi } from 'src/app/modules/standalones/c3-table/c3-table-utils';
import { PageInfoService } from 'src/app/_c3-lib/layout/core/page-info.service';
import{LicenseConsumptionSummaryReportService} from 'src/app/modules/analyze/services/license-consumption-summary-report.service';
import _ from 'lodash';
import { ChildTableConsumptionSummaryReportComponent } from '../child-table-consumption-summary-report/child-table-consumption-summary-report.component';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AppSettingsService } from 'src/app/services/app-settings.service';
@Component({
  selector: 'app-license-consumption-summary-report',
  templateUrl: './license-consumption-summary-report.component.html',
  styleUrl: './license-consumption-summary-report.component.scss'
})
export class LicenseConsumptionSummaryReportComponent {
  reloadEvent: EventEmitter<boolean> = new EventEmitter();
  _subscription: Subscription;
  @ViewChild('iconTemplate') iconTemplate: TemplateRef<any>;
  searchCriteria: any = {};
  allcustomers: any[] = [];
  allTenants: any[] = [];
  selectedCustomer: any = '';
  licenseConsumptionReport: any[] = [];
  totalRows: any;
  datatableConfig: ADTSettings;
  datatableConfig1: ADTSettings;
  childTable: ElementRef;
  filtersExpanded: boolean = false;
  @ViewChild('selectElement') selectElement!: NgSelectComponent;
  @ViewChild('selectElement1') selectElement1!: NgSelectComponent;
  @ViewChild('selectElement2') selectElement2!: NgSelectComponent;
 
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    if (this.selectElement.isOpen) {
      this.selectElement.close();
    }
    if (this.selectElement1.isOpen) {
      this.selectElement1.close();
    }
    if (this.selectElement2.isOpen) {
      this.selectElement2.close();
    }
  }

  destroy$ = new Subject<void>();
  _subscriptionArray: Subscription[] = [];
  constructor(
    private _cdRef: ChangeDetectorRef,
    private renderer: Renderer2,
    private viewContainerRef: ViewContainerRef,
    private translateService: TranslateService,
    private licenseConsumptionSummaryReportService :LicenseConsumptionSummaryReportService,
    private pageInfo: PageInfoService,
    private resolver: ComponentFactoryResolver,
    private appSettingsService:AppSettingsService
  ) {}

  ngOnInit(): void {
    this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.LICENSE_CONSUMPTION_REPORT_TEXT_LICENSE_CONSUMPTION_REPORT"),true);
    this.pageInfo.updateBreadcrumbs(['MENUS_ANALYZE', 'LICENSE_CONSUMPTION_REPORT_TEXT_LICENSE_CONSUMPTION_REPORT']);
    this.getAllCustomers();
    this.getTenants();
    this.handleTableConfig();
  }

  getAllCustomers() {
    const subscription = this.licenseConsumptionSummaryReportService.getCustomers().pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        const customers = response.Data;
        if (customers && customers.length > 0) {
          // Remove duplicates by 'Name'
          this.allcustomers = customers.filter((customer, index, self) =>
            index === self.findIndex(c => c.Name === customer.Name)
          );
  
          this.allcustomers.sort((a, b) => a.Name.localeCompare(b.Name));
  
          this.onCustomerChange();
        }
      });
      this._subscriptionArray.push(subscription);
  }
  onCustomerChange() {
    this.searchCriteria.TenantId = null;
    this.selectedCustomer = _.find(this.allcustomers, customer => customer.ID.toString() === this.searchCriteria.CustomerId);
    this.getTenants();
  }
  
  getTenants() {
    const subscription = this.licenseConsumptionSummaryReportService.getTenants(this.selectedCustomer).pipe(takeUntil(this.destroy$))
      .subscribe(tenants => {
        this.allTenants = tenants.sort((a, b) => a.CustomerName.localeCompare(b.CustomerName));
      });
      this._subscriptionArray.push(subscription);
  }
  resetFilters() {
    this.searchCriteria.CustomerId = null;
    this.searchCriteria.TenantId = null;
    this.searchCriteria.SubscriptionName = null;
    this.handleTableConfig();
  }
  filter() {
    this.handleTableConfig();
  }
  onTableReady(table: ElementRef) {
    this.childTable = table;
    //litsen click event
    this.renderer.listen(this.childTable.nativeElement, 'click', (event) => {
      if (
        event.target.closest('td') &&
        event.target.classList.contains('clicked-icon')
      ) {
        // You can now access the table element and perform operations on it
        const tr = event.target.closest('tr');
        const table = $(this.childTable.nativeElement).DataTable();
        const row = table.row(tr);
        if (row?.data()) {
          if (row.child.isShown()) {
            row.child.hide();
            row.data()['Collapse'] = false;
          } else {
            row.data()['Collapse'] = true;
            this.fetchChildlineItemsForSummaryView(row, row.data());
          }
          this._cdRef.detectChanges();
        }
      }
    });
  }
  fetchChildlineItemsForSummaryView(row: any, data: any) {
    const searchParams: any = {
      TenantId: data.ProviderTenantId,
      SubscriptionSkuId: data.SubscriptionSkuId,
      SortColumn: 'EmailAddress',
      SortOrder: 'ASC',
      PageSize: 10,
      StartInd: 1,
      WhereClauseXML: '' 
    };
    this.loadChildComponent(row, searchParams);
  }
  loadChildComponent(row: any, searchParams: any) {
    const componentFactory = this.resolver.resolveComponentFactory(ChildTableConsumptionSummaryReportComponent);
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    // Set the searchParams input of the ChildTableComponent
    componentRef.instance.data = searchParams;
    // Trigger change detection to ensure the data is displayed correctly
    componentRef.changeDetectorRef.detectChanges();
    row.child(componentRef.location.nativeElement).show();
  }

  handleTableConfig() {
    this.datatableConfig = null;
    const self = this;
    
    setTimeout(() => {
        this.datatableConfig = {
            serverSide: true,
            pageLength:(this.appSettingsService.$rootScope.DefaultPageCount || 10),
            ordering:false,
            ajax: (dataTablesParameters: any, callback: any) => {
              const { StartInd, Name, SortColumn, SortOrder, length } =
              mapParamsWithApi(dataTablesParameters);
            
                const reqBody: any = {
                    CustomerId: this.searchCriteria.CustomerId,
                    ProviderId: 1,
                    TenantId: this.searchCriteria.TenantId,
                    SortColumn: 'Customer',
                    SortOrder: 'ASC',
                    PageSize: length,
                    StartInd: StartInd,
                    WhereClauseXML: this.searchCriteria.SubscriptionName
                };

                const subscription = this.licenseConsumptionSummaryReportService
                    .getLicenseConsumptionSummaryReport(reqBody).pipe(takeUntil(this.destroy$))
                    .subscribe((Data: any) => {
                      let recordsTotal = 0;
                      if (Data.length > 0) {
                        [{ TotalRows: recordsTotal }] = Data;
                      }
                      callback({
                        data: Data,
                        recordsTotal: recordsTotal || 0,
                        recordsFiltered: recordsTotal || 0,
                      });
                    });
                    this._subscriptionArray.push(subscription);
            },
            columns: [
              {
                className: 'dt-icon-control',
                defaultContent: '',
                orderable:false,
                ngTemplateRef: {
                  ref: this.iconTemplate,
                  context: {
                    // needed for capturing events inside <ng-template>
                    captureEvents: self.onCaptureEvent.bind(self),
                  },
                },
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_CUSTOMER'),
                data: 'CustomerName',
                orderable: false,
                className: '',
                render: (data: string) => {
                  return '<span class="fw-semibold">' + data + '</span>';
                }
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_TENANT'),
                data: 'ProviderTenantName',
                orderable: false,
                className: '',
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_SUBSCRIPTION'),
                data: 'SubscriptionName',
                orderable: false,
                className: '',
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_MAPPED_PRODUCTS'),
                data: 'MappedProducts',
                orderable: false,
                className: '',
                render: (data: any) => {
                  if (data && data.length > 0) {
                    return `<ul><li><span>${data}</span></li></ul>`;
                  } else {
                    return '';
                  }
                }
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_PROVIDER_LICENSE_COUNT'),
                data: 'TotalLicenseCountInPC',
                orderable: false,
                className: 'text-end pe-4',
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_PROVIDER_ASSIGNED_LICENSE_COUNT'),
                data: 'AssignedLicenseCountInPC',
                orderable: false,
                className: 'text-end pe-4',
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_PROVIDER_UNUSED_LICENSE_COUNT'),
                data: 'UnUsedLicenseCountInPC',
                orderable: false,
                className: 'text-end pe-4',
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_C3_LICENSE_COUNT'),
                data: 'TotalLicenseCountInC3',
                orderable: false,
                className: 'text-end pe-4',
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_C3_ASSIGNED_LICENSE_COUNT'),
                data: 'AssignedLicenseCountInC3',
                orderable: false,
                className: 'text-end pe-4',
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_LICENSE_QUANTITY_DIFFERENCE'),
                data: 'TotalLicenseQuantityDifference',
                orderable: false,
                className: 'text-end pe-4',
              },
              {
                title: this.translateService.instant('TRANSLATE.LICENSE_CONSUMPTION_REPORT_TABLE_HEADER_ASSIGNED_LICENSE_QUANTITY_DIFFERENCE'),
                data: 'AssignedicenseQuantityDifference',
                orderable: false,
                className: 'text-end pe-4',
              }
            ]
        };
        this._cdRef.detectChanges();
    });
}

  ngOnDestroy(): void {
    if (this._subscription) {
      this._subscription?.unsubscribe();
      this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    }
}

onCaptureEvent(event: Event) { }

}
