import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { mapParamsWithApi } from '../../../../standalones/c3-table/c3-table-utils';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import {
    NgbModal,
    NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NotifierService } from 'src/app/services/notifier.service';
import { PermissionService } from 'src/app/services/permission.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PlansListingService } from '../../services/plans-listing.service';
import { CommonService } from 'src/app/services/common.service';
import { ReportPopupComponent } from 'src/app/modules/standalones/report-popup/report-popup.component';
import {
    MODAL_DIALOG_CLASS,
    ReportPopupConfig,
} from 'src/app/shared/models/report-popup.model';
import { FileService } from 'src/app/services/file.service';
import { ToastService } from 'src/app/services/toast.service';
import { ProductService } from 'src/app/services/product.service';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3Router, C3RouterService } from 'src/app/services/c3-router.service';
import { catchError, interval, of, Subscription, takeUntil } from 'rxjs';
import { C3tableService } from 'src/app/modules/standalones/c3-table/c3table.service';
@Component({
    selector: 'app-plans-listing',
    templateUrl: './plans-listing.component.html',
    styleUrl: './plans-listing.component.scss',
})
export class PlansListingComponent extends C3BaseComponent implements OnInit, OnDestroy {
    datatableConfig: ADTSettings;
    isEditing: boolean[] = [];
    toolbarButtonHeightClass = 'w-30px h-30px w-md-40px h-md-40px';
    @ViewChild('actions') actions: TemplateRef<any>;
    @ViewChild('nameTemplate') nameTemplate: TemplateRef<any>;
    @ViewChild('providerSelectionModel') providerSelectionModel: TemplateRef<any>;
    @ViewChild('value') value: TemplateRef<any>;

    modalConfig: NgbModalOptions = {
        modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
    };

    tablePlanList: any;
    Providers: any[] = [];
    selectedProvider: any;
    Categories: any[] = [];
    selectedCategory: any;
    currencyCode: any;
    //properties added for getting the pending status of clone plan and add all offers to a new plan
    private CancelResellerPlansPageTableReload: Subscription | null = null;
    needReload = false;
    // Reload emitter inside datatable
    reloadEvent: EventEmitter<boolean> = new EventEmitter();
    entityName: string;
    Name: string = '';
    StartInd: number = 1;
    SortColumn: string = '';
    SortOrder: string = 'asc';
    keyForData: any = null;
    currentPageIndex: number = 0;
    isIntervalClick: boolean = false;

    constructor(
        private plansListingService: PlansListingService,
        private toastService: ToastService,
        private modalService: NgbModal,
        private cdRef: ChangeDetectorRef,
        private translateService: TranslateService,
        private _notifierService: NotifierService,
        public _router: Router,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private _commonService: CommonService,
        private _fileService: FileService,
        private _productService: ProductService,
        private pageInfo: PageInfoService,
        public _appService: AppSettingsService,
        private c3RouterService: C3RouterService,
        private c3TableService: C3tableService,
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appService);
        this.entityName = _commonService.entityName;
        this.navigation = this._router.getCurrentNavigation();
        this.keyForData = this.navigation?.extras.state?.['keyForData'];
        if (this.keyForData) {
            this.searchParams = this.c3RouterService.retrieveData(this.keyForData);
            this.persistPropertySet();
        }
    }

    ngOnInit(): void {
        localStorage.removeItem("planinfo");
        localStorage.removeItem("macroTypeId");
        localStorage.removeItem("macroValue");
        localStorage.removeItem("selectedMacro");
        this._productService.resetData();
        this.pageInfo.updateTitle(this.translateService.instant("TRANSLATE.MENUS_PARTNER_PLANS"), true);
        if (this._commonService.entityName === 'Reseller') {
            this.pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_SELL', 'MENUS_PARTNER_PLANS']);
        }
        else if (this._commonService.entityName === 'Partner') {
            this.pageInfo.updateBreadcrumbs(['MENUS_SELL_DIRECT', 'MENUS_PARTNER_PLANS']);
        }
        // use setTimeout as a hack to ensure the `demoNg` is usable in the datatables rowCallback function
        this.handleTableConfig();
        this.getProvider();
        this.getApplicationData();
    }

    getApplicationData() {
        const subscription = this._appService.getApplicationData().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.currencyCode = response.Data.CurrencyCode;
        });
        this._subscriptionArray.push(subscription);
    }


    handleTableConfig() {
        setTimeout(() => {
            const self = this;
            this.currentPageIndex = this.StartInd;
            const perPage = this._appService.$rootScope.DefaultPageCount || 10;
            this.datatableConfig = {
                serverSide: true,
                pageLength: perPage,
                ADTSettings: {
                    enableEscapeHTML: true
                },
                ajax: (dataTablesParameters: any, callback: any) => {
                    const { StartInd, Name, SortColumn, SortOrder, length } =
                        mapParamsWithApi(dataTablesParameters);
                    let C3Input = this.c3RouterService.getC3Input();
                    if ((C3Input === null || C3Input === undefined) && this.keyForData && this.Name) {
                        this.c3RouterService.setC3Input(this.Name)
                    } else {
                        this.Name = C3Input || ''
                    }
                    this.destroyInterval();
                    this.Name = this.keyForData && (Name === null || Name === undefined || Name === '') ? this.Name : Name;
                    this.StartInd = (this.keyForData && StartInd === 1) ? this.StartInd : StartInd;
                    this.SortColumn = this.keyForData ? this.SortColumn : SortColumn;
                    this.SortOrder = this.keyForData ? this.SortOrder : SortOrder;
                    if (self.isIntervalClick && this.currentPageIndex != null && this.currentPageIndex >= 0) {
                        this.StartInd = this.currentPageIndex;
                    }
                    const subscription = this.plansListingService
                        .getList({ StartInd: this.StartInd, Name: this.Name, SortColumn: this.SortColumn, SortOrder: this.SortOrder, length })
                        .pipe(takeUntil(this.destroy$)).subscribe(({ Data }: any) => {
                            if (this.currentPageIndex != null && this.currentPageIndex >= 0 && self.isIntervalClick) {
                                self.isIntervalClick = false;
                                this.c3Table?.page(this.StartInd - 1)?.draw('page');
                                this.currentPageIndex = 0;
                            }
                            const [{ TotalRows: recordsTotal = 0 } = {}] = Data.length > 0 ? Data : [{}];
                            this.applyEscapeHTML(Data)
                            this.tablePlanList = Data;
                            this.needReload = false;
                            Data.filter((plan: any) => {
                                if (plan.PlanStatus !== 'Success' && plan.PlanStatus !== 'Error') {
                                    this.intervalFunction();
                                    this.needReload = true;  // Assuming 'needReload' is a property of the component/service
                                }
                            });
                            if (!this.needReload) {
                                this.destroyInterval();
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
                        searchable: false,
                        title: this.translateService.instant('TRANSLATE.PLAN_TABLE_HEADER_TEXT_NAME'),
                        data: 'Name',
                        className: 'col-md-3',
                        render: (data: string, type: any, row: any, meta: any) => {
                            return '<span class="fw-semibold">' + data + '</span>';
                        }
                    },
                    {
                        title: this.translateService.instant('TRANSLATE.PLAN_TABLE_HEADER_TEXT_DESCRIPTION'),
                        data: 'Description',
                        className: 'col-md-3',
                        orderable: false
                    },
                    {
                        title: this.translateService.instant('TRANSLATE.PLAN_MACRO_DETAILS_LABEL_TEXT'),
                        data: 'MacroDetails',
                        className: 'col-md-2',
                        orderable: false,
                    },
                    {
                        title: this.translateService.instant('TRANSLATE.PLAN_MACRO_VALUE_LABEL_TEXT'),
                        data: 'MacroValue',
                        className: 'text-end pe-20',
                        orderable: false,
                        ngTemplateRef: {
                            ref: this.value,
                            context: {
                                // needed for capturing events inside <ng-template>
                                captureEvents: self.onCaptureEvent.bind(self),
                            },
                        },
                    },

                    {
                        title: this.translateService.instant('TRANSLATE.PLAN_TABLE_HEADER_TEXT_ACTIONS'),
                        defaultContent: '',
                        className: 'col-md-1 text-end column-title-pe-5',
                        orderable: false,
                        ngTemplateRef: {
                            ref: this.actions,
                            context: {
                                // needed for capturing events inside <ng-template>
                                captureEvents: self.onCaptureEvent.bind(self),
                            },
                        },
                    },
                ],
            } as any;
            this.cdRef.detectChanges();
        })
    }

    onCaptureEvent(event: Event) { }

    enableEditField(data: any) { }

    editPlanDetails(plan: any, planType: string) {
        this.Name = '';
        const planId = plan.ID;
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/plans/plandetails`];
        c3Router.extras = { state: { planId: planId, planType: planType } };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);
    }

    addPlanDetails() {
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/plans/plandetails`];
        c3Router.extras = { state: {} };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);
    }

    setData() {
        return {
            Name: this.Name,
            StartInd: this.StartInd,
            SortColumn: this.SortColumn,
            SortOrder: this.SortOrder
        }
    }

    deletePlan(plan: any) {
        const planId = plan.ID;
        const customOfferName = plan.Name;
        const confirmationText = this.translateService.instant(
            'TRANSLATE.POPUP_DELETE_PARTNER_OFFER_CONFIRMATION_TEXT',
            { customOfferName: customOfferName }
        );
        this._notifierService
            .confirm({ title: confirmationText })
            .then((result: { isConfirmed: any; isDenied: any }) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                    const subscription = this.plansListingService.deletePlan(planId).pipe(
                        catchError((err) => {
                            let errmsg: string = this.translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                            this.toastService.error(errmsg, {
                                timeOut: 5000
                            });
                            return of(null);
                        })
                    ).pipe(takeUntil(this.destroy$)).subscribe((response) => {
                        if (response != null) {
                            this.toastService.success(this.translateService.instant('TRANSLATE.POPUP_PLAN_DELETED', { planName: plan.Name }))
                            this.reloadEvent.emit(true);
                        }
                    });
                    this._subscriptionArray.push(subscription);
                }
            });
    }

    addMissingOffersToAllPlan(mode: string) {
        if (mode === 'Add') {
            const subscription = this.plansListingService
                .getAddMissingOffersPlansStatus().pipe(takeUntil(this.destroy$))
                .subscribe((response: any) => {
                    if (response.Status === 'Success') {
                        let webojobstatusresponse = response.Data;
                        let isEnqueueMessage = true;
                        let totalPlanWithOfferCount =
                            this.tablePlanList.length > 0
                                ? this.tablePlanList[0].TotalCountWithOffer
                                : 0;
                        let jobCount = 0;
                        let counts = webojobstatusresponse.C3Plans.reduce(
                            (p: any, c: any) => {
                                let JobLogC3Id = c.JobLogC3Id;
                                if (!p.hasOwnProperty(JobLogC3Id)) {
                                    p[JobLogC3Id] = 0;
                                    jobCount++;
                                }
                                p[JobLogC3Id]++;

                                if (p[JobLogC3Id] > 1) {
                                    isEnqueueMessage = false;
                                }
                                return p;
                            },
                            {}
                        );

                        if (
                            (isEnqueueMessage && totalPlanWithOfferCount != jobCount) ||
                            totalPlanWithOfferCount === 0
                        ) {
                            let message = this.translateService.instant(
                                'TRANSLATE.POPUP_ADDING_MISSING_OFFERS_CONFIRMATION_TEXT'
                            );
                            if (
                                (isEnqueueMessage && totalPlanWithOfferCount != jobCount) ||
                                totalPlanWithOfferCount === 0
                            ) {
                                this._notifierService
                                    .confirm({
                                        title: message,
                                        icon: 'info',
                                        confirmButtonColor: '#F64E60',
                                    })
                                    .then((result: { isConfirmed: any; isDenied: any }) => {
                                        this._router.navigate(
                                            ['partner/plans/addmissingofferstoallplan'],
                                            { state: { pageMode: mode } }
                                        );
                                    });
                            }
                        } else {
                            this._router.navigate(
                                ['partner/plans/addmissingofferstoallplan'],
                                { state: { pageMode: 'Status' } }
                            );
                        }
                    }
                });
            this._subscriptionArray.push(subscription);
        } else {
            this._router.navigate(['partner/plans/addmissingofferstoallplan'], {
                state: { pageMode: mode },
            });
        }
    }

    placeQueueMessageToLoadPromotions() {
        this.modalService.dismissAll();
        const subscription = this.plansListingService
            .placeQueueMessageToLoadPromotions().pipe(takeUntil(this.destroy$))
            .subscribe((res: any) => {
                let promotionCount = res.Data;
                if (promotionCount > 0) {
                    const confirmationText = this.translateService.instant(
                        'TRANSLATE.LOADING_PROMOTIONS_AGAIN_WARNING'
                    );
                    this._notifierService
                        .confirm({
                            title: confirmationText,
                            icon: 'info',
                            customClass: {
                                confirmButton: 'bg-success'
                            },
                        })
                        .then((result: { isConfirmed: any; isDenied: any }) => {
                            if (result.isConfirmed) {
                                const subscription = this.plansListingService
                                    .providerPromotions(
                                        this.selectedProvider.Name,
                                        this.selectedCategory.Name
                                    ).pipe(takeUntil(this.destroy$))
                                    .subscribe((response: any) => {
                                        const message = this.translateService.instant(
                                            'TRANSLATE.REQUEST_FOR_LOADING_PROMOTIONS_IS_QUEUED_SUCCESS_MESSAGE'
                                        );
                                        this.toastService.success(message);
                                    });
                                this._subscriptionArray.push(subscription);
                            }
                        });
                } else {
                    const subscription = this.plansListingService
                        .providerPromotions(
                            this.selectedProvider.Name,
                            this.selectedCategory.Name
                        )
                        .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                            const message = this.translateService.instant(
                                'TRANSLATE.REQUEST_FOR_LOADING_PROMOTIONS_IS_QUEUED_SUCCESS_MESSAGE'
                            );
                            this.toastService.success(message);
                        });
                    this._subscriptionArray.push(subscription);
                }
            });
        this._subscriptionArray.push(subscription);
    }

    getProvider() {
        const subscription = this._commonService.getProviders().pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
            this.Providers = response;
            let provider = this.Providers.find((o: any) => {
                if (o.Name == 'Microsoft') {
                    return true;
                }
            });
            if (provider != undefined && provider != null) {
                this.selectedProvider = provider;
            } else {
                provider = this.Providers[0];
                this.selectedProvider = provider;
            }
            this.getProviderCategories(provider.ID);
        });
        this._subscriptionArray.push(subscription);
    }

    planCurrencyConversion(plan: any) {
        this.Name = '';
        const planId = plan.ID;
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/plans/planproductcurrencyconversion`];
        c3Router.extras = { state: { planId: planId } };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);
        // this._router.navigate([`partner/plans/planproductcurrencyconversion`]
        //   , { state: { planId: planId } });
    }
    getProviderCategories(ID: any) {
        const subscription = this._commonService
            .getCategoriesByProviderId(ID)
            .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                this.Categories = response.Data;
                let category = this.Categories.find((obj: any) => {
                    if (obj.Name == 'OnlineServicesNCE') {
                        return true;
                    }
                });
                this.selectedCategory = category;
            });
        this._subscriptionArray.push(subscription);
    }

    loadpromotions() {
        const modalRef = this.modalService.open(this.providerSelectionModel);
    }

    closeModalPopup() {
        this.modalService.dismissAll();
    }

    onProviderChange(provider: any) {
        this.selectedProvider = provider;
        this.getProviderCategories(provider.ID);
    }

    onCategoryChange(category: any) {
        this.selectedCategory = category;
    }

    planProductsSeatLimit = (row: any) => {
        this.Name = '';
        let c3Router = new C3Router();
        c3Router.keepHistory = true;
        c3Router.commands = [`partner/plans/planproductseatlimits`];
        c3Router.extras = { state: { id: row.ID, name: row.Name } };
        c3Router.data = this.setData()
        this.c3RouterService.navigate(c3Router);
        // this._router.navigate(['partner/plans/planproductseatlimits'], { state: { id: row.ID, name: row.Name } });
    }

    downloadGridReport() {
        const moduleName = 'partner.plan';
        const subscription = this._commonService
            .getDownloadableReportColumnsForPlans({ moduleName: moduleName })
            .pipe(takeUntil(this.destroy$)).subscribe((response: any) => {
                /* Creating config model */
                let reportConfig = new ReportPopupConfig();
                reportConfig.Columns = response.Data;
                reportConfig.title = 'DOWNLOAD_GRID_POPUP_PLAN_DOWNLOAD_HEADER';
                reportConfig.isSubmitButton = false;
                reportConfig.IsColumnsAvailable = true;
                reportConfig.IsSubHeaderAvailable = false;
                reportConfig.EmailInstructionText = '';
                reportConfig.actionTooltipText = '';
                /* selecting Size of popup based on condition */
                const config: NgbModalOptions = {
                    modalDialogClass: reportConfig.IsSubHeaderAvailable
                        ? MODAL_DIALOG_CLASS
                        : '',
                };
                const modalRef = this.modalService.open(ReportPopupComponent, config);
                modalRef.componentInstance.reportConfig = reportConfig;
                modalRef.result.then(
                    (result) => {
                        if (result) {
                            let selectedColumn: any = [];
                            result.Columns.map((e: any) => {
                                if (e.IsChecked === true) {
                                    selectedColumn.push(e.ColumnName);
                                }
                            });
                            let columns = selectedColumn.join(',');
                            let reqbody = {
                                ColumnNames: columns,
                                EntityName: this._commonService.entityName,
                                RecordId: this._commonService.recordId,
                                WebURL: window.location.protocol + "//" + window.location.host
                            };
                            if (columns != '' && columns.length > 0) {
                                this._fileService.post('plans/downloadplans', true, reqbody);
                            } else {
                                this.toastService.error(
                                    this.translateService.instant(
                                        'TRANSLATE.DOWNLOAD_CUSTOMER_ATLEAST_SELECT_ONE_COLUMN_ERROR'
                                    )
                                );
                            }
                        }
                    },
                    (reason) => {
                        /* Closing modal reference if cancelled or clicked outside of the popup*/
                        modalRef.close();
                    }
                );
            });
        this._subscriptionArray.push(subscription);
    }

    goToProductCatalogue() {
        const currencyCode = this.currencyCode;
        this._router.navigate([`/partner/plans/productcatalogue`], {
            state: { CurrencyCode: currencyCode }
        });
    }

    intervalFunction() {
        if (this.CancelResellerPlansPageTableReload == null) {
            this.CancelResellerPlansPageTableReload = interval(3000).subscribe(() => {
                if (this._router.url === '/partner/plans') {
                    this.c3TableService.currentStartIndex = this.StartInd;
                    this.isIntervalClick = true;
                    this.handleTableConfig();
                } else {
                    this.destroyInterval();
                }
            });
        }
    }

    destroyInterval(): void {
        if (this.CancelResellerPlansPageTableReload) {
            this.CancelResellerPlansPageTableReload.unsubscribe();
            this.CancelResellerPlansPageTableReload = null;
        }
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

}
