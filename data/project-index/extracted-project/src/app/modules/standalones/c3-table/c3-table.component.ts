import { CommonModule, NgFor } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef, input } from '@angular/core';
import { NgbDateAdapter, NgbDateNativeAdapter, NgbDatepickerModule, NgbModal, NgbModalOptions, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DataTableDirective, DataTablesModule } from 'angular-datatables';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { Api } from 'datatables.net';
import { Subject, Subscription, debounceTime, distinctUntilChanged, fromEvent, map, merge, takeUntil } from 'rxjs';
import { SharedModule } from 'src/app/_c3-lib/shared/shared.module';
import { checkboxColumn, defaultCheckboxProps } from './c3-table-utils';
import { AddressRowComponent } from '../../home/profile/profile-user/addresses-details/adress-row/adress-row.component';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { C3RouterService } from 'src/app/services/c3-router.service';
import _ from 'lodash';
import { CommonNoRecordComponent } from "../common-no-record/common-no-record.component";
import { CommonEventTrigerredService } from '../../../services/common-event-trigerred.service'
import { C3tableService, CheckboxType } from './c3table.service';
declare const bootstrap: any;
@Component({
    selector: 'app-c3-table',
    standalone: true,
    imports: [
        DataTablesModule,
        NgFor,
        SharedModule,
        CommonModule,
        NgbModule,
        NgbDatepickerModule,
        FormsModule,
        TranslateModule,
        CommonNoRecordComponent
    ],
    providers: [{ provide: NgbDateAdapter, useClass: NgbDateNativeAdapter }],
    templateUrl: './c3-table.component.html',
    styleUrl: './c3-table.component.scss'
})
export class C3TableComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
    @ViewChild('c3table', { static: true }) c3table: ElementRef;
    private observer: MutationObserver;
    @Output() tableReady = new EventEmitter<ElementRef>();
    @Output() pageSizeChange = new EventEmitter<number>();
    @Output() selectAllchecked = new EventEmitter<boolean>();
    @Input() datatableConfig: any = {};
    @Input() tableId!: any;
    @ViewChild('tableBody', { read: ViewContainerRef, static: false }) tableBody!: ViewContainerRef;
    @ViewChild('additionalRow', { read: ViewContainerRef, static: false }) additionalRow!: ViewContainerRef;
    private componentRefs = new Map<number, any>(); // To track components
    private nextRowId = 0;
    public totalCount: number = 0
    activePageSize: number = 10
    isList: boolean = false;
    keyForData
    previousSelectedData: any = [];
    @Input() route: string = '/';
    @Input() isNestedGrid: boolean = false;
    @Input() isPagination: boolean = false;
    @Input() tooltipText!: any;

    // Reload emitter inside datatable
    @Input() reload: EventEmitter<boolean>;
    destroy$ = new Subject<void>();

    @Input() checkboxWithTooltip: boolean;
    @Input() modal: TemplateRef<any>;
    @Input() searchFilter: boolean = true;
    @Input() customeHeader!: TemplateRef<any> | null;
    @Input() multiSearch: TemplateRef<any> | null;
    @Input() isPaginationHide?: boolean = false;
    @Input() defaultPageObj?: any;
    @Input() isPaginationRowHide?: boolean = false;
    @Input() selection: boolean;
    @Output() onSelection: EventEmitter<any> = new EventEmitter();
    @Input() hasPagination: boolean = true;
    @Input() hideSelectAllLabel: boolean = false;
    isServerSide: boolean;
    isSortOrderClick: boolean;

    pageOptions: number[] = [5, 10, 25, 50, 100, 200, 500, 1000]
    enableSearch: boolean;
    columnSearchOptions: any[] = [];
    dtOptions: ADTSettings | any;
    @Input() C3searchtext?: any;
    setdtOption() {
        const componentRef = this; // ? Store reference to Angular component
        this.dtOptions = {
            dom: "<'row'<'col-sm-12 p-0'tr>>" +
                "<'row'<'d-flex col-sm-12 col-md-5 ps-0'il><'col-sm-12 col-md-7'p>>",
            // dom:'<"bottom"lfip><"clear">rt',
            language: {
                emptyTable: '  ',
                processing: '<span class="spinner-border spinner-border-sm align-middle"></span> Loading...',
                paginate: {
                    next: 'Next',
                    previous: 'Previous'
                },
                info: 'Showing _START_ to _END_ of _TOTAL_ records',
                infoEmpty: 'Showing 0 to 0 of 0 records',
                infoFiltered: '',
                // infoFiltered: '(filtered from _MAX_ total records)',
            },
            length: this.activePageSize,
            lengthMenu: [5, 10, 25, 50, 100, 200, 500, 1000],
            initComplete: function () {
                const self = this;
                self.columnSearchOptions = [];
                self.api().columns().every(function () {
                    const column = this;
                    const title = column.header().textContent.trim(); // Column title
                    // Check if column is searchable based on its settings
                    if (column.settings()[0].aoColumns[column.index()].searchable) {
                        self.columnSearchOptions.push(column.dataSrc())
                        // Create input element and add event listener
                        $(`<div class="d-grid align-items-center position-relative my-1 text-start">
              <app-keenicon name="magnifier" class="fs-3 ms-5 mb-1" >
                <span class="fs-3 ki-duotone ki-magnifier ms-5 position-absolute">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </span>
              </app-keenicon>
              <input type="text" data-field="${column.dataSrc()}" data-action="filter" class="header-input-field form-control form-control-sm form-control-solid w-150px ps-10"
                placeholder="">
            </div>`)
                            .appendTo($(column.footer()).empty());
                    } else if (column.settings()[0].aoColumns[column.index()].selectable) {
                        let optionArray = column.settings()[0].aoColumns[column.index()].optionsArray
                        let option = ``;
                        optionArray.forEach(element => {
                            option += `<option value="${element.id}">${element.name}</option>`;
                        });
                        // Create input element and add event listener
                        $(`<div class="col-auto">
            <select  data-field="${column.dataSrc()}" data-action="filter" class="header-select form-select form-select-solid form-select-lg fw-bold">
            <option value="" ${column.settings()[0].aoColumns[column.index()]?.disableDefaultSelect ? 'disabled selected' : ''}></option>
            ${option}
            </select>
        </div>`)
                            .appendTo($(column.footer()).empty());
                    }
                    else {
                        // If column is not searchable, do not add any search field
                        $(column.footer()).empty(); // Clear footer content
                    }
                });
            },
            drawCallback: function () {
                const self = componentRef; // ? Angular component reference
                const table = this.api();
                const uncheckedCheckboxes = document.querySelectorAll('input[type=checkbox].row-selection-checkbox:not(:checked)');
                const allCheckboxes = document.querySelectorAll('input[type=checkbox].row-selection-checkbox');
                 if (allCheckboxes.length > 0) {
                    self.isTableNoRecord = false;
                    self.setPaginationDefault(allCheckboxes.length)
                }

                if (self.c3tableService.selectAllchecked) {
                    uncheckedCheckboxes.forEach((checkbox: any) => {
                        checkbox.checked = true;
                    });
                }
                else {
                    //selectAllCheckbox.checked = component.c3tableService.selectAllchecked;
                    allCheckboxes.forEach((checkbox: any) => {
                        const rowData = table.rows(checkbox.value).data()[0];
                        let isCheckBoxStateChanged = false;
                        if (self.c3tableService && self.c3tableService.compareData(rowData)) {
                            checkbox.checked = true;
                            isCheckBoxStateChanged = true;
                        }
                        if (rowData.isCheckBoxChecked) {
                            checkbox.checked = true;
                            isCheckBoxStateChanged = true
                        }
                        if(!isCheckBoxStateChanged)
                        {
                            checkbox.checked = false; 
                        }
                        if (rowData.isCheckBoxDisabled) {
                            checkbox.disabled = true;
                        }
                    });

                }
                if (self.isSortOrderClick) {
                    self.updatePaginationUI(self.c3tableService.currentStartIndex)
                }
                const tableBody = $(table.table().body());
                const columnCount = table.columns().count();
                let columnData = Array(columnCount).fill(null).map(() => []);
                const dataCount = table.rows().count()
                // Initialize an array to hold total costs for each column
                let totalCosts = Array(columnCount).fill('');
                let currencySymbol;
                let currencyCode;
                let showTotalRow = false;
                table.columns().every(function () {
                    const column = this;
                    const columnIndex = column.index();
                    // Check if the column should show a total
                    const columnSettings = column.settings()[0].aoColumns[columnIndex];
                    if (columnSettings.totalCost) {
                        const data = column.data().toArray();
                        const rowData = table.rows().data().toArray();
                        const totalSum = rowData[0]?.TotalCost;
                        currencySymbol = rowData[0]?.CurrencySymbol;
                        currencyCode = rowData[0]?.CurrencyCode;
                        // Get the total cost from the column settings
                        totalCosts[columnIndex] = totalSum.toFixed(2); // Adjust format as needed
                        if (!!totalSum) {
                            showTotalRow = true;
                        }
                    }
                });

                // Create HTML for the total cost row
                let totalCostHtml = totalCosts.map((cost, index) =>
                    index === 0
                        ? `<td class="text-dark-75 fw-bolder font-size-lg">Total Amount</td>`  // Always display "Total Amount" in the first column
                        : (!!cost
                            ? `<td class="text-end text-dark-75 fw-bolder font-size-lg">${currencyCode}${currencySymbol}${cost}</td>`
                            : `<td></td>`) // Empty cell for columns with no cost
                ).join('');

                // Clear old total row and append new total row
                tableBody.find('.total-cost-row').remove();
                if (showTotalRow) {
                    tableBody.append(`<tr class="total-cost-row">${totalCostHtml}</tr>`);
                }

                setTimeout(() => {
                    if (allCheckboxes) {
                        self.updateSelectAllCheckboxState();
                    }
                }, 100)
            }
        };

    }
    dtTrigger: Subject<ADTSettings> = new Subject<ADTSettings>();


    @ViewChild(DataTableDirective, { static: true })
    private _datatableElement: DataTableDirective;

    private _subscription: Subscription[] = [];
    modalConfig: NgbModalOptions = {
        modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
    };
    private _modalRef: NgbModalRef;

    private clickListener: () => void;
    loadPagination: boolean = false;
    dataTable: any;
    childTableInit: boolean = false;
    isTableNoRecord: boolean = false;
    startInd: number = 0;

    constructor(
        private _modalService: NgbModal,
        private _cdref: ChangeDetectorRef,
        private componentFactoryResolver: ComponentFactoryResolver,
        private renderer: Renderer2,
        public _router: Router,
        private c3RouterService: C3RouterService,
        private translate: TranslateService,
        private CommonEventTrigerred: CommonEventTrigerredService,
        private c3tableService: C3tableService,
        private elementRef: ElementRef
    ) {
        this.setdtOption()
        this.dtOptions.language = {
            emptyTable: '  ',
            processing: `<span class="spinner-border spinner-border-sm align-middle"></span> ${this.translate.instant('TRANSLATE.LOADING_MESSAGE')}`,
            paginate: {
                next: `${this.translate.instant('TRANSLATE.PARTNER_BUNDLES_BUTTON_TEXT_NEXT')}`,
                previous: `${this.translate.instant('TRANSLATE.QUOTE_MOVE_BACK_TO_STATE')}`
            },
            info: this.translate.instant('TRANSLATE.TABLE_FOOTER_TEXT_SHOWING_COUNT', { StartIndex: '_START_', EndIndex: '_END_', Total: '_TOTAL_' }),
            infoEmpty: this.translate.instant('TRANSLATE.SHOWING_RECORDS'),
            infoFiltered: '',
            // infoFiltered: '(filtered from _MAX_ total records)',
        };
    }
 
    ngOnInit(): void {
        if(!this.datatableConfig.ADTSettings || !this.datatableConfig.ADTSettings.enableEscapeHTML){ 
            this.dtOptions = {
                ...this.dtOptions,
                ...this.datatableConfig,
                columnDefs: [
                    {
                      targets: '_all',
                      render: $.fn.dataTable.render.text() // ✅ correct usage
                    }
                ]
            };
        }else{ 
            this.dtOptions = {
                ...this.dtOptions,
                ...this.datatableConfig, 
            };
        }
        
        this.startInd = this.datatableConfig.tabIndex ? this.datatableConfig.tabIndex : 0;
        this.isServerSide = this.datatableConfig?.serverSide || false;
        if (!this.isServerSide) {
            this.c3tableService.checboxType = CheckboxType.clientSideOnly;
        }
        this.enableSearch = this.dtOptions.columns.some(elm => elm.searchable || elm.selectable);
        // make use of this function to add logic for advance features
        this.handleTableConfiguration();
        if (this.reload) {
            this.reload.subscribe(data => {
                //this._modalService?.dismissAll();
                this._datatableElement.dtInstance.then((dtInstance: Api) => {
                    dtInstance.columns().every(function () {
                        this.search(''); // Clear search for each column
                    });

                    // prevent multiple api for a single emit event removed draw(false);
                    // two async api calls brings innacurate data
                    // ajax already reloads the table 
                    // hence draw can be removed
                    dtInstance.search('')
                    // dont reset page number in connectwise
                    if(this.c3tableService.isOldPaginationPersist){
                     // as mentioned below code can affect in some places hence
                     // if a search is performed then start index should reset to 1  
                     dtInstance.page(0);
                    }
                    //draw(false);
                     // Clear the global search and redraw the table
                    // Clear the column-specific search input boxes manually
                    let val = this.c3RouterService.getC3Input() || '';
                    this.c3RouterService.setC3Input(val);
                    this.loadPagination = true;
                    this.isTableNoRecord = false;
                    this.c3tableService.currentStartIndex = dtInstance.page()+1;

                    if (!!this.datatableConfig.ajax) {
                        dtInstance.ajax.reload(() => {
                            let rowCount = dtInstance.rows({ search: 'applied' }).count();
                            this.setPaginationDefault(rowCount);
                        },false)
                    } else if (!!this.datatableConfig?.data) {
                        dtInstance.clear();
                        dtInstance.rows.add(this.datatableConfig.data).draw();
                        if (this.datatableConfig?.data?.length == 0) {
                            this.loadPagination = false;
                            this.isTableNoRecord = true;
                            this.isPaginationHide = true;
                        }
                        let self = this;

                        this.c3RouterService.paginationInfo.rowCount = this.dataTable.page.len();
                        this.c3RouterService.paginationInfo.pagIndex = this.dataTable.page() + 1;

                        this._datatableElement.dtInstance.then((dtInstance: Api) => {
                            dtInstance.columns().every(function () {
                                let rowCount = dtInstance.rows({ search: 'applied' }).count();
                                self.setPaginationDefault(rowCount);
                            });
                            // dtInstance.search(value);
                            dtInstance.draw();
                        })
                        let rowCount = dtInstance.rows({ search: 'applied' }).count();
                        this.setPaginationDefault(rowCount);
                    }

                });
            });
        }
         this.c3tableService.___dataChange.pipe().subscribe((_) => {
             if (this._datatableElement && this._datatableElement.dtInstance) {
            this._datatableElement.dtInstance.then((dtInstance: Api) => {
                let rowCount = dtInstance?.rows({ search: 'applied' }).count();
                this.setPaginationDefault(rowCount);
            });
            }
            this.updateSelectAllCheckboxState();
        })

        this.addDataTableEventListener();
    }

    reloadGrid() {
        this.dtOptions.length = this.activePageSize;
        this.dtOptions.pageLength = this.activePageSize;
        if (this._datatableElement.dtInstance) {
            this._datatableElement.dtInstance.then((dtInstance: any) => {
                dtInstance.destroy();
                this.dtTrigger.next(this.dtOptions);
            });
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            // race condition fails unit tests if dtOptions isn't sent with dtTrigger
            this.dtTrigger.next(this.dtOptions);
            this.addDataTableEventListener();
            // Emit the table reference once the view has been initialized
            if (this.isNestedGrid && !this.isPagination) {
                this.tableReady.emit(this.c3table);
            }
        },);
        setTimeout(() => {
            const elements = document.querySelectorAll('li.dt-paging-button.page-item');
            if (this.startInd != 0) {
                elements.forEach((element: any, index) => {
                    if (element.className === "dt-paging-button page-item active") {
                        element.className = "dt-paging-button page-item"
                    }
                    if (index === (this.startInd + 1)) {
                        element.className = "dt-paging-button page-item active"
                    }
                });
            }
            this.updateSelectAllCheckboxState();

            const selectAllCheckbox = document.querySelector('input.dt-checkboxes') as HTMLInputElement;
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener("click", () => {
                    let isServerSide = this.datatableConfig?.serverSide || false;
                    if (selectAllCheckbox && selectAllCheckbox.checked && !selectAllCheckbox.indeterminate) {
                        this.c3tableService.selectAllchecked = true;
                        if (isServerSide && this.c3tableService.checboxType == CheckboxType.serverSideWithapi) {
                            this.c3tableService.checkBoxStatusChange(true);
                            this.selectAllchecked.emit(true);
                        }
                        else if (isServerSide && this.c3tableService.checboxType == CheckboxType.serverSideOnly) {
                            this.updateSelectAllCheckboxState();
                        }
                        else {
                            this.selectAllDataForClientSidePagination();
                        }
                        this.selectAllchecked.emit(true);
                    } else {
                        this.unselectAllCheckbox();
                        this.c3tableService.selectAllchecked = false;
                        this.selectAllchecked.emit(false);
                        this.c3tableService.previousSelectedData = [];
                    }
                })
            }

        }, 1000)
        this.keyForData = history.state['keyForData'];
        if (this.c3table) {
            this.observeTableChanges();
        }
    }

    async unselectAllCheckbox() {
        let selectedData = [];
        const api: Api = await this._datatableElement.dtInstance;
        const allData = api.rows().data().toArray(); // Convert to array
        allData.forEach(v => {
            v['isCheckBoxDisabled'] = false;
            v['isCheckBoxChecked'] = false;
        })
        this.c3tableService.previousSelectedData = selectedData;
        this.c3tableService.totalRecord = this.c3tableService?.totalRecord ?? allData.length;
    }

    async selectAllDataForClientSidePagination() {
        let selectedData = [];
        const api: Api = await this._datatableElement.dtInstance;
        const allData = api.rows().data().toArray(); // Convert to array
        allData.forEach(v => {
            //todo: disabled need to check 
            if (!v.isCheckBoxDisabled || v.isCheckBoxDisabled != true) {
                selectedData.push(v);
            }
        })
        this.c3tableService.previousSelectedData = selectedData;
        this.c3tableService.totalRecord = this.c3tableService?.totalRecord ?? allData.length;
    }

    observeTableChanges() {
        this.observer = new MutationObserver((mutations) => {
            this.setupDataTable();
        });

        this.observer.observe(this.c3table.nativeElement, {
            childList: true,  // Detects row additions/removals
            subtree: true,    // Watches child elements inside the table
        });
    }


    generateArray(length: any) {
        let result = [];
        for (let i = 0; i < length; i++) {
            result.push(i.toString());
        }
        return result;
    }



    handleTableConfiguration() {
        let self: any = this;
        if (this.selection) {
            let totalCount: any
            const selectionColumnDef: any = {
                className: this.hideSelectAllLabel ? 'w-3' : '',
                ...checkboxColumn,
                checkboxes: {
                    ...(this.hideSelectAllLabel ? checkboxColumn.hideSelectAllLabel : this.checkboxWithTooltip ? checkboxColumn.checkboxesWithTooltip : checkboxColumn.checkboxes),
                    selectCallback: async (nodes: any, selected: any) => {
                        const api: Api = await this._datatableElement.dtInstance;
                        totalCount = api.rows().count();
                        const selectedCheckboxes = document.querySelectorAll('input[type=checkbox].row-selection-checkbox:checked');
                        const uncheckedCheckboxes = document.querySelectorAll('input[type=checkbox].row-selection-checkbox:not(:checked)');
                        let unSelectedCheckboxData: any[] = [];
                        let keysToRemove = new Set();

                        uncheckedCheckboxes.forEach((checkbox: any) => {
                            const rowData = api.rows(checkbox.value).data()[0];
                            if (rowData) {
                                rowData.isCheckBoxChecked = false;
                                unSelectedCheckboxData.push(rowData);
                                const key = self.c3tableService.generateRowKey(rowData);
                                keysToRemove.add(key);
                            }
                        });

                        this.c3tableService.previousSelectedData = this.c3tableService.previousSelectedData.filter((item: any) => {
                            const itemKey = this.c3tableService.generateRowKey(item);
                            return !keysToRemove.has(itemKey);
                        });

                        this.c3tableService.selectAllchecked = false;
                        let selectedCheckboxData: any[] = [];
                        let hashSet = new Set(self.c3tableService.previousSelectedData.map(d => self.c3tableService.generateRowKey(d)));

                        selectedCheckboxes.forEach((checkbox: any) => {
                            const rowData = api.rows(checkbox.value).data()[0];
                            if (rowData) {
                                rowData.isCheckBoxChecked = true;
                                selectedCheckboxData.push(rowData);
                                const hash = self.c3tableService.generateRowKey(rowData);
                                if (!hashSet.has(hash)) {
                                    self.c3tableService.previousSelectedData.push(rowData);
                                    hashSet.add(hash);
                                }
                            }
                        });
                        // Update "Select all" checkbox state
                        self.updateSelectAllCheckboxState();
                        self.previousSelectedData = self.c3tableService.previousSelectedData;
                        self.totalCount = totalCount || 0;
                        self.onSelection.emit(self.previousSelectedData);
                    }
                }
            };
            // Update datatable options
            this.dtOptions = {
                ...this.dtOptions,
                ...(!this.dtOptions?.order ? { order: defaultCheckboxProps.order } : {}), // Keep existing order if present
                columnDefs: [...(this.dtOptions.columnDefs || []), ...defaultCheckboxProps.columnDefs], // Merge columnDefs
                select: defaultCheckboxProps.select, // Always update select
            };
            this.dtOptions.columns = [selectionColumnDef, ...this.dtOptions.columns];
        }
    }



    removeUncheckedAndCombineUnique(arr1: any[], arr2: any[], toRemove: any[] = []) {
        // Remove unchecked items using Lodash's _.isEqual    
        const filteredArr = arr1.filter(item => !_.some(toRemove, removeItem => _.isEqual(item, removeItem))
        );    // Combine both arrays    
        const combined = [...filteredArr, ...arr2];
        // Use a Map to ensure uniqueness by storing the stringified version as the key    
        const uniqueMap = new Map();
        combined.forEach(item => {      // Generate a unique key based on the stringified version of the object      
            const key = JSON.stringify(item);
            if (!uniqueMap.has(key)) { uniqueMap.set(key, item); }
        });
        // Return the unique values from the map    
        return Array.from(uniqueMap.values());
    }



    // Function to update the "Select all" checkbox state
    updateSelectAllCheckboxState() {
        const selectAllCheckbox = document.querySelector('input.dt-checkboxes') as HTMLInputElement;
        let selectedDataCount = this.c3tableService.previousSelectedData.length;
        let totalRecordCount = this.c3tableService?.totalRecord;
        if (!totalRecordCount && this.c3tableService.previousSelectedData?.length > 0) {
            let obj: any = this.c3tableService.previousSelectedData[0];
            totalRecordCount = (obj.TotalRecords || obj.TotalRows) || 0;
        }
        if (selectAllCheckbox) {
            if (this.c3tableService.checboxType === CheckboxType.serverSideWithapi) {
                // Update the state of the "Select all" checkbox
                if (selectedDataCount > 0 && totalRecordCount != selectedDataCount) {
                    selectAllCheckbox.indeterminate = true; // Set indeterminate if some but not all are checked
                    this.c3tableService.selectAllchecked = false;
                    this.c3tableService.selectAllchecked = false;
                }
                else if (totalRecordCount != selectedDataCount) {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = false;
                    this.c3tableService.selectAllchecked = false;
                }
            }
            if (this.c3tableService.checboxType === CheckboxType.serverSideOnly || this.c3tableService.checboxType === CheckboxType.clientSideOnly) {
                if (!this.c3tableService.selectAllchecked && selectedDataCount > 0 && totalRecordCount != selectedDataCount) {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = true;
                }
                else if (!this.c3tableService.selectAllchecked && selectedDataCount == 0) {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = false;
                }
            }
            if (totalRecordCount === selectedDataCount) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
                this.c3tableService.selectAllchecked = true;
            }
        }
    }

    addRow(component: any, data: any = null) {
        if (this.tableBody) {
            const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
            const componentRef = this.tableBody.createComponent(componentFactory);
            if (!!data && componentRef.instance.hasOwnProperty('data')) {
                componentRef.instance['data'] = data
            }

            // Assign a unique ID to the row
            const rowId = this.nextRowId++;
            this.componentRefs.set(rowId, componentRef);

            // Optionally: Add ID to the component instance if needed
            const element = componentRef.location.nativeElement;
            element.setAttribute('data-row-id', rowId);
            // Insert the new row before the first child (if any)
            const tableBodyElement = this.tableBody.element.nativeElement;
            const emptyTableElement = tableBodyElement.querySelector('.dt-empty');
            if (emptyTableElement) {
                emptyTableElement.style.display = 'none';
            }
            tableBodyElement.prepend(element);
            this.isTableNoRecord = false;
        }
    }

    addRowForCustom(component: any, data: any = null) {
        if (this.tableBody) {
            const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
            const componentRef = this.tableBody.createComponent(componentFactory);
            if (!!data && componentRef.instance.hasOwnProperty('data')) {
                componentRef.instance['data'] = data
            }

            // Assign a unique ID to the row
            const rowId = data.index;
            this.componentRefs.set(rowId, componentRef);

            // Optionally: Add ID to the component instance if needed
            const element = componentRef.location.nativeElement;
            element.setAttribute('data-row-id', rowId);
            // Insert the new row before the first child (if any)
            const tableBodyElement = this.tableBody.element.nativeElement;
            const emptyTableElement = tableBodyElement.querySelector('.dt-empty');
            if (emptyTableElement) {
                emptyTableElement.style.display = 'none';
            }
            tableBodyElement.prepend(element);
        }
    }

    // Remove a row by its ID
    // Remove a row by its ID
    removeRow(rowId: number): void {
        if (this.componentRefs.has(rowId)) {
            const componentRef = this.componentRefs.get(rowId);

            // Destroy the component and remove it from the map
            if (componentRef) {
                componentRef.destroy();
                this.componentRefs.delete(rowId);

                // Remove the element from the DOM
                const tableBodyElement = this.tableBody?.element.nativeElement;
                if (tableBodyElement) {
                    const rowElement = tableBodyElement.querySelector(`[data-row-id="${rowId}"]`);
                    if (rowElement) {
                        tableBodyElement.removeChild(rowElement);  // Remove the specific row
                    }
                }
            }
        }
    }

    editRow(component, data) {
        if (this._datatableElement) {
            this._datatableElement.dtInstance.then((dtInstance: Api) => {
                const rowIndex = dtInstance.rows().indexes().toArray().find(index => {
                    const rowData = dtInstance.row(index).data();
                    if (rowData?.AddressId && rowData.AddressId === data.AddressId) return true;
                    if (rowData?.PhoneId && rowData.PhoneId === data.PhoneId) return true;
                    if (rowData?.EmailId && rowData.EmailId === data.EmailId) return true;
                    return false;
                });

                if (rowIndex !== undefined) {
                    const rowNode = dtInstance.row(rowIndex).node();
                    const existingElement = $(rowNode).find(`[data-row-id]`).get(0);

                    if (existingElement) {
                        const existingRowId = existingElement.getAttribute('data-row-id');
                        this.removeRow(Number(existingRowId)); // Remove the existing component
                    }

                    // Create and insert the new component
                    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
                    const componentRef = this.tableBody.createComponent(componentFactory);

                    const addressRowComponent = componentRef.instance as AddressRowComponent;
                    addressRowComponent.address = data;

                    const newElement = componentRef.location.nativeElement;
                    newElement.setAttribute('data-row-id', this.nextRowId);
                    this.componentRefs.set(this.nextRowId, componentRef);
                    this.nextRowId++;

                    $(rowNode).empty().append(newElement);
                } else {
                    console.warn('No matching row found for AddressID:', data?.AddressId);
                }
            });
        } else {
            console.error('Datatable element is not initialized.');
        }
    }

    ngOnDestroy(): void {
        if (this.reload && !this.reload.closed) {
            this.reload.unsubscribe();
        }
        //this._modalService?.dismissAll();
        this._subscription?.forEach(v => v.unsubscribe());
        this.destroy$.next();
        this.destroy$.complete();
        this.c3tableService.resetData();
    }


    triggerFilter(search: string = null) {

        /* -----------------------------------------
         1️⃣ Disabled checkbox styling (SAFE)
        ----------------------------------------- */
        const disabledCheckboxes =
          this.elementRef.nativeElement.querySelectorAll(
            'input[type=checkbox].row-selection-checkbox:disabled'
          );
      
        disabledCheckboxes.forEach((checkbox: any) => {
          this.renderer.addClass(checkbox, 'cursor-not-allowed');
          this.renderer.setStyle(checkbox, 'pointer-events', 'auto');
        });
      
        /* -----------------------------------------
         2️⃣ Scope DOM to THIS component
        ----------------------------------------- */
        const componentEl: HTMLElement = this.elementRef.nativeElement;
        const parentEl = this.elementRef.nativeElement.parentElement as HTMLElement | null;

      
        if (!parentEl) return;
      
        const inputElements =
          parentEl.querySelectorAll<HTMLInputElement>('.header-input-field');
      
        const selectElements =
          componentEl.querySelectorAll<HTMLSelectElement>('.header-select');
      
        /* -----------------------------------------
         3️⃣ Programmatic parent search (CRITICAL)
        ----------------------------------------- */
        if (search && inputElements.length > 0) {
          inputElements[0].value = search; // ✅ FIX
          this._datatableElement.dtInstance.then((dt: Api) => {
            dt.search(search).draw(false);
          });
        }
      
        /* -----------------------------------------
         4️⃣ Event streams (isolated)
        ----------------------------------------- */
        const inputObservables = Array.from(inputElements).map(input =>
          fromEvent(input, 'keyup').pipe(
            map((event: any) => {
              event.stopImmediatePropagation();
              event.stopPropagation();
              return event;
            })
          )
        );
      
        const selectObservables = Array.from(selectElements).map(select =>
          fromEvent(select, 'change').pipe(
            map((event: any) => {
              event.stopImmediatePropagation();
              event.stopPropagation();
              return event;
            })
          )
        );
      
        /* -----------------------------------------
         5️⃣ Merge & apply filters
        ----------------------------------------- */
        const sub = merge(...inputObservables, ...selectObservables)
          .pipe(
            takeUntil(this.destroy$),
            debounceTime(300),
            map((event: any) => {
              const target = event.target as HTMLElement;
              const field = target.getAttribute('data-field');
              const value = (target as HTMLInputElement).value
                ?.trim()
                .toLowerCase();
              return { field, value };
            }),
            distinctUntilChanged((prev, curr) =>
                  prev.field === curr.field && prev.value === curr.value
              )
          )
          .subscribe(({ field, value }) => {
      
            this._datatableElement.dtInstance.then((dt: Api) => {
      
              if (!field) {
                /* ✅ GLOBAL SEARCH */
                dt.search(value);
              } else {
                /* ✅ COLUMN SEARCH */
                dt.columns().every(function () {
                  if (this.dataSrc() === field) {
                    this.search(value);
                  }
                });
              }
      
              dt.page(0).draw(false);
      
              const rowCount = dt.rows({ search: 'applied' }).count();
              this.setPaginationDefault(rowCount);
            });
          });
      
        this._subscription.push(sub);
      }
      


    addDataTableEventListener(): void {
        let self = this;
        if (this._datatableElement && this._datatableElement.dtInstance) {
            let search: any = this.datatableConfig.search
            this._datatableElement.dtInstance.then((dtInstance: Api) => {
                if (search) {
                    this.triggerFilter(search.search);
                } else {
                    this.triggerFilter();
                }
                let rowCount = dtInstance.rows({ search: 'applied' }).count();
                if (!self.datatableConfig?.serverSide) self.setPaginationDefault(rowCount);
                dtInstance.on('draw', () => {
                    let rowCount = dtInstance.rows({ search: 'applied' }).count();
                    if (self.datatableConfig?.serverSide || self.isTableNoRecord) self.setPaginationDefault(rowCount);
                    // Initialize DataTable
                    this.dataTable = $(this.c3table.nativeElement).DataTable();
                    if (this.isPagination && this.dataTable) {
                        this.tableReady.emit(this.dataTable);
                    }
                    // To get the current page size
                    // if(this.c3tableService.isOldPaginationPersist){
                        // dtInstance.on('page.dt', () => {
                        //     this.c3tableService.currentStartIndex = dtInstance.page() + 1;
                        // });
                        // dtInstance.on('order.dt', () => {
                        //     const info = dtInstance.page.info();
                        //     if (this.c3tableService.currentStartIndex != 1) {
                        //         this.isSortOrderClick = true;
                        //     }
                        // });
                        // dtInstance.on('preXhr.dt', (e: any, settings: any, data: any) => {
                        //     if (this.c3tableService.isReloadHappen == true) {
                        //         this.c3tableService.currentStartIndex = dtInstance.page();

                        //     }
                        //     else {
                        //         this.c3tableService.currentStartIndex = dtInstance.page() + 1;

                        //     }
                        //     if (this.isSortOrderClick) {
                        //         data.start = this.c3tableService.currentStartIndex * data.length;
                        //     }
                        // });
                    // }
                    if (this.dataTable && this.defaultPageObj && !this.childTableInit) {
                        this.childTableInit = true;
                        setTimeout(() => {
                            this.dataTable.page.len(this.defaultPageObj.PageSize).page(this.defaultPageObj?.StartInd - 1).draw('page');
                            this.activePageSize = this.defaultPageObj.PageSize;
                        }, 1000)
                        // if(this.defaultPageObj?.pageSize) this.dataTable.page.len(this.defaultPageObj?.pageSize).draw();
                    }

                    const sub = this.CommonEventTrigerred.popupCloseListner().pipe(takeUntil(this.destroy$)).subscribe((_) => {
                        dtInstance?.off('draw');
                        dtInstance?.off('init');
                    })
                    this._subscription.push(sub)

                    if (this.isPaginationRowHide) {
                        this.dtOptions = {
                            ...this.dtOptions, dom: `<'row'<'col-sm-12 p-0'tr>>" +
            "<'row pagination-empty'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>`}
                    }
                    //Adding cursor not allowed class for disabled checkbox
                    const disabledCheckboxes = document.querySelectorAll('input[type=checkbox].row-selection-checkbox:disabled');
                    if (disabledCheckboxes && disabledCheckboxes.length > 0) {
                        disabledCheckboxes.forEach((checkbox: any) => {
                            this.renderer.addClass(checkbox, 'cursor-not-allowed');
                            this.renderer.setStyle(checkbox, 'pointer-events', 'auto');
                        });
                    }
                    this._cdref.detectChanges()
                });
                dtInstance.on('init', () => {
                    this.triggerFilter();
                    this.initalizeTooltip()
                });
                this._cdref.detectChanges()
            });
        }
    }

    setPaginationDefault(rowCount: any) {
        setTimeout(() => {
            // Use jQuery to change the placeholder text
            let searchText: any = this.translate.instant('TRANSLATE.PLACEHOLDER_FOR_TEXT_SEARCH');
            $('input[data-action="filter"]').attr('placeholder', this.C3searchtext || searchText);
            //Updating default text Select option
            $('select[data-action="filter"] option[value=""]:first').text(this.translate.instant('TRANSLATE.SELECT_DEFAULT_OPTION_SELECT'));
            const selectAllCheckbox = document.querySelector('input.dt-checkboxes') as HTMLInputElement;
            // Find the <span> element next to the checkbox
            // Select All Text convertd based on selected LANGUAGE
            if (selectAllCheckbox && !this.hideSelectAllLabel && !this.checkboxWithTooltip) {
                const spanText = selectAllCheckbox.nextElementSibling as HTMLSpanElement;
                // Change the text content of the <span>
                spanText.textContent = this.translate.instant('TRANSLATE.DOWNLOAD_GRID_POPUP_CHECKBOX_TEXT_SELECT_ALL');
            }
        }, 1000)
        if (rowCount && rowCount > 0) {
            // Conditionally show the length menu
            this.dtOptions.dom = "<'row'<'col-sm-12 p-0'tr>>" +
                "<'row'<'d-flex col-sm-12 col-md-5 ps-0'il><'col-sm-12 col-md-7'p>>";
            setTimeout(() => {
                const lengthMenus = document.querySelectorAll('.dt-length');
                if (lengthMenus.length > 0) {
                    lengthMenus.forEach(lengthMenu => {
                        this.renderer.setStyle(lengthMenu, 'display', 'unset');
                    });
                }
            }, 100)
            this.loadPagination = true;
            this.isTableNoRecord = false;
            if (this.c3table) {
                let currentElement = this.c3table.nativeElement;
                let i = 0;
                while (currentElement && i < 6) {
                    // Check if the current element has the 'pagination' class
                    if (currentElement.classList.contains('dt-bootstrap5')) {
                        if (this.hasPagination) {
                            this.renderer.removeClass(currentElement, 'pagination-empty');
                        }
                        else {
                            this.loadPagination = false;
                            this.renderer.addClass(currentElement, 'pagination-empty');
                        }
                        return true; // Class found
                    }
                    // Move to the next parent element
                    currentElement = currentElement.parentElement;
                    i++;
                }
            }
        } else {
            this.dtOptions.dom = "";
            this.loadPagination = false;
            this.isTableNoRecord = true;
            if (this.c3table) {
                let currentElement = this.c3table.nativeElement;

                let i = 0;
                while (currentElement && i < 6) {
                    // Check if the current element has the 'pagination' class
                    if (currentElement.classList.contains('dt-bootstrap5')) {
                        this.renderer.addClass(currentElement, 'pagination-empty');
                        return true; // Class found
                    }
                    // Move to the next parent element
                    currentElement = currentElement.parentElement;
                    i++;
                }
            }
        }
    }


    initalizeTooltip() {
        var exampleEl = document.getElementById('tooltip-checkbox');
        if (!!exampleEl) {
            const tooltip = new bootstrap.Tooltip(exampleEl, {
                title: this.tooltipText,
                placement: 'bottom'
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this._datatableElement && this._datatableElement.dtInstance) {
            this._datatableElement.dtInstance.then((dtInstance: Api) => {
                if (!!changes?.datatableConfig?.currentValue.data) {
                    dtInstance.clear();
                    dtInstance.rows.add(this.datatableConfig.data).draw();
                }
                if (this.datatableConfig?.data?.length == 0) {
                    this.loadPagination = false;
                    this.isTableNoRecord = true;
                    this.isPaginationHide = true;
                }
                let self = this;
                dtInstance.columns().every(function () {
                    let rowCount = dtInstance.rows({ search: 'applied' }).count();
                    // self.setPaginationDefault(rowCount);
                });
                // dtInstance.search(value);
                dtInstance.draw();
                let rowCount = dtInstance.rows({ search: 'applied' }).count();
                // this.setPaginationDefault(rowCount);
            });
        }
    }


    ngAfterViewChecked(): void {

    }

    private setupDataTable(): void {

        if (!this.dataTable) return;

        this.c3RouterService.paginationInfo.rowCount = this.dataTable.page.len();
        this.c3RouterService.paginationInfo.pagIndex = this.dataTable.page() + 1;
        if (!this.isList && this.keyForData) {
            this.handleDataTableDraw();
        }
    }

    private handleDataTableDraw(): void {
        this.keyForData = history.state['keyForData'];
        this.isList = true; // Prevent unnecessary reprocessing
        if (!this.keyForData) return;

        const data = this.c3RouterService.retrieveData(this.keyForData);
        const C3Input = this.c3RouterService.getC3Input();

        if (data) {
            this.dtOptions.length = this.activePageSize;
            if (this.dataTable) {
                let index = this.dtOptions.columns.findIndex(((item: any) => item.data == data.SortColumn))
                if (data.PageSize && data.ActivePage) {
                    if (index != -1) {
                        this.dataTable.page.len(data.PageSize).order([index, data.SortOrder]).page(data.ActivePage - 1).draw('page');
                    } else {
                        this.dataTable.page.len(data.PageSize).order([]).page(data.ActivePage - 1).draw('page');
                    }
                } else if (data.ActivePage) {
                    this.updatePaginationUI(data.ActivePage);
                } else if (data.PageSize) {
                    if (index != -1) {
                        this.dataTable.page.len(data.PageSize).order([index, data.SortOrder]).page(0).draw('page');
                    } else {
                        this.dataTable.page.len(data.PageSize).order([]).page(0).draw('page');
                    }
                }
                if (index != -1) this.setTableOrdering(index, data.sortOrder);
            }
            //for filling first c3 Input value
            if (!C3Input && data?.Name) {
                this.c3RouterService.setC3Input(data.Name);
            } else if (C3Input === '') {
                this.c3RouterService.setC3Input('');
            }
        }
    }

    setTableOrdering(columnIndex: number, sortOrder: string) {
        // Optional: wait for draw to finish (in case DOM updates are async)
        setTimeout(() => {
            const header = $(this.dataTable.column(columnIndex).header());

            // Remove existing ordering classes
            header.removeClass('dt-ordering-asc dt-ordering-desc');

            // Add correct ordering class
            if (sortOrder === 'asc') {
                header.addClass('dt-ordering-asc');
                header.attr('aria-sort', 'ascending');
            } else {
                header.addClass('dt-ordering-desc');
                header.attr('aria-sort', 'descending');
            }
        }, 0);
    }

    private updatePaginationUI(activePage: number): void {
        const elements = document.querySelectorAll('li.dt-paging-button.page-item');
        elements.forEach((element: any, index) => {
            element.className = "dt-paging-button page-item";
            if (index === activePage + 1) {
                element.className = "dt-paging-button page-item active";
            }
        });
    }

}
