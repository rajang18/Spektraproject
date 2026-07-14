import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ADTSettings } from 'angular-datatables/src/models/settings';
import { catchError, of, takeUntil } from 'rxjs';
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { AdminRelationshipsService } from '../../services/admin-relationships.service';
import { AdminRelationshipPayLoad } from '../../model/admin-relatioships.model';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { ToastService } from 'src/app/services/toast.service';
import { CommonService } from 'src/app/services/common.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
    selector: 'app-add-admin-relatioships',
    templateUrl: './add-admin-relatioships.component.html',
    styleUrl: './add-admin-relatioships.component.scss'
})
export class AddAdminRelatioshipsComponent extends C3BaseComponent implements OnInit {
    adminRelationshipPayLoad: AdminRelationshipPayLoad;
    addRelationshipForm: FormGroup;
    isSubmit: boolean = false;
    @ViewChild('micosoftEntraRoles') micosoftEntraRoles: TemplateRef<any>;
    datatableConfig: ADTSettings;
    microsoftEntraRolesFromDB: any[] = [];
    selectedEntraRolesFromPopup: any[] = [];
    selectedEntraRoles: any[] = [];
    selectedEntraRolesNames: string = "";
    customerData: any;
    uniqueDisplayName: boolean;
    validatingUniqueName: boolean;
    validateName: string;
    entityName: string | null;
    recordId: string | null;
    isPartnerLevel: boolean = false;
    allCustomers: any[] = [];
    provider: string = 'Microsoft';
    currentC3CustomerId: any;
    providerCoustomerCount: number | null = 0;
    allTenants: any[] = [];
    tenants: any[] = [];
    providerTenantsCount: number = 0;
    selectedServiceProviderCustomer: any;
    showHelpText = false;
    pageType = '';
    adminRelationhipDetails = null;
    microsoftEntraRolesForDetails: any[] = [];
    requestMessage: any = '';
    encodedrequestMessage: any = '';
    emailSubject: any = '';
    entraRoleGlobalAdministartionExist: boolean = false; 
    firstLoad: boolean = true;
    commaSeparatedNames:string
    constructor(
        private _pageInfo: PageInfoService,
        public _router: Router,
        public _permissionService: PermissionService,
        public _dynamicTemplateService: DynamicTemplateService,
        private _formBuilder: FormBuilder,
        private _modalService: NgbModal,
        private _translateService: TranslateService,
        private _adminRelationshipService: AdminRelationshipsService,
        public _appSettingsService: AppSettingsService,
        private _toastService: ToastService,
        private _commonService: CommonService,
        private clipboard: Clipboard,
        private _cdrefService: ChangeDetectorRef,
    ) {
        super(_permissionService, _dynamicTemplateService, _router, _appSettingsService);
        this.navigation = this._router.getCurrentNavigation();
        this.addRelationshipForm = this._formBuilder.group({
            addRelationshipName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
            duration: ['', [Validators.required, Validators.min(1), Validators.max(730), Validators.pattern(/^\d+$/)]],
            autoExtend: [false]
        });
    }

    ngOnInit(): void {
        this.pageType = 'form';
        this._pageInfo.updateTitle(this._translateService.instant("MENUS_ADMIN_RELATIONSHIPS"), true);
        this._pageInfo.updateBreadcrumbs(['SIDEBAR_TITLE_MENUS_CUSTOMER_MICROSOFT', 'MENUS_ADMIN_RELATIONSHIPS']);
        this.entityName = this._commonService.entityName;
        this.recordId = this._commonService.recordId;

        if (localStorage.getItem('selectedServiceProviderCustomer') != null && localStorage.getItem('selectedServiceProviderCustomer') != undefined) {
            this.selectedServiceProviderCustomer = JSON.parse(localStorage.getItem('selectedServiceProviderCustomer'));
            this._cdrefService.detectChanges();
        }

        if (this.entityName === "Partner" || this.entityName === "Reseller") {
            this.isPartnerLevel = true;
        }

        if (!this.isPartnerLevel) {
            this.getTenants();
        }
        else {
            this.getAllCustomers();
        }
        this.getData();
    }

    get math() {
        return Math;
    }

    getAllCustomers() {
        this.allCustomers = [];
        const subscription = this._adminRelationshipService.getCustomers(this.provider)
            .pipe(
                takeUntil(this.destroy$),
                catchError((err) => {
                    let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                    this._toastService.error(errmsg, {
                        timeOut: 10000
                    });
                    return of(null);
                })
            ).subscribe((res: any) => {
                if (res != null) {
                    var data = res.Data;
                    data.filter((item: any) => {
                        var i = this.allCustomers.findIndex(x => (x.C3Id == item.C3Id));
                        if (i <= -1) {
                            this.allCustomers.push(item);
                        }
                    });

                    this.allCustomers.sort((a, b) => {
                        let nameA = a.Name.toLowerCase();
                        let nameB = b.Name.toLowerCase();

                        if (nameA < nameB) {
                            return -1;
                        }
                        if (nameA > nameB) {
                            return 1;
                        }
                        return 0; // names are equal
                    });

                    if (localStorage.getItem('selectedServiceProviderCustomer') != null && localStorage.getItem('selectedServiceProviderCustomer') != undefined) {
                        this.currentC3CustomerId = this.selectedServiceProviderCustomer.CustomerC3Id;
                    } else {
                        this.currentC3CustomerId = this.allCustomers[0].C3Id;
                    }

                    this.onCustomerChange();
                    if (this.allCustomers !== undefined && this.allCustomers !== null && this.allCustomers.length > 0) {
                        this.providerCoustomerCount = this.allCustomers.length;
                    }
                    else {
                        this.providerCoustomerCount = 0;
                    }
                }
            });
            this._subscriptionArray.push(subscription);
    }

    onCustomerChange() {
        this.getTenants();
    }

    getTenants() {
        // startBlockUI();
        var urlRoute = '';
        var entityName: string | null = null;
        var recordId: string | null = null;
        if (this.isPartnerLevel) {
            entityName = "Customer";
            recordId = this.currentC3CustomerId;
            urlRoute = 'customers/' + entityName + '/' + this.currentC3CustomerId + '/Providers/' + this.provider + '/Tenants';
        } else {
            entityName = this.entityName;
            recordId = this.recordId;
            urlRoute = 'customers/' + entityName + '/' + recordId + '/Providers/' + this.provider + '/Tenants';
        }
        const subscription =  this._adminRelationshipService.getTenants(urlRoute).pipe(takeUntil(this.destroy$))
            .pipe(
                takeUntil(this.destroy$),
                catchError((err) => {
                    let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                    this._toastService.error(errmsg, {
                        timeOut: 10000
                    });
                    return of(null);
                })
            ).subscribe((res: any) => {
                if (res != null) {
                    this.allTenants = res.Data;
                    this.tenants = [];
                    this.allTenants.forEach(val => this.tenants.push(Object.assign({}, val)));
                    if (this.tenants !== undefined && this.tenants !== null) {
                        this.providerTenantsCount = this.tenants.length;
                    }
                    else {
                        this.providerTenantsCount = 0;
                    }

                    if (this.firstLoad && localStorage.getItem('selectedServiceProviderCustomer') != null && localStorage.getItem('selectedServiceProviderCustomer') != undefined) {
                        this.selectedServiceProviderCustomer = JSON.parse(localStorage.getItem('selectedServiceProviderCustomer'));
                        this.firstLoad = false;
                    } else {
                        this.selectedServiceProviderCustomer = this.tenants[0];
                    }
                    this.addRelationshipForm.reset();
                    this.selectedEntraRoles = [];
                    this.checkEntraRoleConsistGlobalAdministartionRole();
                }
            });
            this._subscriptionArray.push(subscription);
    }

    handleTableConfig() {
        setTimeout(() => {
            this.datatableConfig = {
                serverSide: false,
                pageLength: 10,
                paging: false,
                info: false,
                data: this.microsoftEntraRolesFromDB,
                columns: [
                    {
                        title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_MICROSOFT_ENTRA_ROLES_POPUP_LABLE_NAME'),
                        data: 'Name',
                        render: (data: string) => {
                            if (data != null) {
                                return `<span class="fw-semibold">${data}</span>`
                            }
                            else {
                                return `<span></span>`
                            }
                        }
                    },
                    {
                        title: this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_MICROSOFT_ENTRA_ROLES_POPUP_LABLE_DESCRIPTION'),
                        data: 'Description',
                        orderable: false
                    }
                ]
            }
        })
    }

    selectMicrosoftEntraRoles() {
        this.selectedEntraRolesFromPopup = this.selectedEntraRoles;
        if (this.microsoftEntraRolesFromDB && this.microsoftEntraRolesFromDB.length > 0) {
            this.microsoftEntraRolesFromDB.forEach((item: any) => {
                if (this.selectedEntraRoles && this.selectedEntraRoles.length > 0 && this.selectedEntraRoles.find((v) => v.Id == item.Id)) {
                    item.isCheckBoxChecked = true;
                }
                else {
                    item.isCheckBoxChecked = false;
                }
            })
        }
        const modalRef = this._modalService.open(this.micosoftEntraRoles, { size: 'xl' });
        modalRef.result.then((result) => {
            this.selectedEntraRoles = this.selectedEntraRolesFromPopup;
            this.selectedEntraRoles.sort((a, b) => a.Name.localeCompare(b.Name));
            this.selectedEntraRolesNames = this.selectedEntraRoles.map(item => item.Name).join(', ');
            this.checkEntraRoleConsistGlobalAdministartionRole();
        },
            (reason) => {
                /* Closing modal reference if cancelled or clicked outside of the popup*/
                modalRef.close();
            });
    }

    getData() {
        const subscription = this._adminRelationshipService.getMicrosoftEntraRoles().pipe(takeUntil(this.destroy$)).subscribe((res: any) => {
            this.microsoftEntraRolesFromDB = res.Data;
            this.handleTableConfig();
        })
        this._subscriptionArray.push(subscription);
    }

    validateDisplayName() {
        if (this.addRelationshipForm.get('addRelationshipName').valid) {
            this.validatingUniqueName = true;
            this.validateName = this.addRelationshipForm.get("addRelationshipName").value;
            const subscription = this._adminRelationshipService.getAdminRelationshipsList(this.provider, this.currentC3CustomerId, this.selectedServiceProviderCustomer.CustomerRefId, this.validateName, 'validate')
                .pipe(
                    catchError((err) => {
                        let errmsg: string = "";
                        let jsonObject = JSON.parse(err.error.ErrorMessage);
                        if (jsonObject && jsonObject.ErrorValue) {
                            errmsg = this._translateService.instant('TRANSLATE.' + jsonObject.ErrorValue);
                        }
                        else {
                            errmsg = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                        }
                        this._toastService.error(errmsg, {
                            timeOut: 5000
                        });
                        this.validatingUniqueName = false;
                        return of(null);
                    })
                ).subscribe((res: any) => {
                    if (res != null) {
                        if (res.Data.length == 0) {
                            this.uniqueDisplayName = true;
                        }
                        else {
                            this.uniqueDisplayName = false;
                        }
                        this.validatingUniqueName = false;
                    }
                });
                this._subscriptionArray.push(subscription);
        }
    }

    handleSelection(event: any) {
        this.selectedEntraRolesFromPopup = event;
    }

    setAdminRelationshipData() {
        let data =
        {
            adminRelationshipName: this.addRelationshipForm.get("addRelationshipName").value,
            durationInDays: this.addRelationshipForm.get("duration").value,
            autoExtend: this.addRelationshipForm.get("autoExtend").value,
        }
        return data;
    }

    convertDurationIntoISO(days: string): string {
        return "P" + days + "D";
    }

    getRoleDefinition(): any {
        let data: any[] = [];
        this.selectedEntraRoles.forEach((v: any) => {
            let item = {
                roleDefinitionId: v.EntraRoleId
            }
            data.push(item);
        })
        return { unifiedRoles: data };
    }

    getAutoExtend(flag: boolean): string {
        if (flag) {
            return "P180D";
        }
        else {
            return "PT0S";
        }
    }

    submit() {
        this.isSubmit = true;
        if (this.addRelationshipForm.valid && this.selectedEntraRoles.length > 0 && this.uniqueDisplayName) {
            let addRelationshipData = this.setAdminRelationshipData();
            this.adminRelationshipPayLoad = new AdminRelationshipPayLoad();
            this.adminRelationshipPayLoad.displayName = addRelationshipData.adminRelationshipName;
            this.adminRelationshipPayLoad.customer = { tenantId: this.selectedServiceProviderCustomer.CustomerRefId, displayName: this.selectedServiceProviderCustomer.CustomerName };
            this.adminRelationshipPayLoad.duration = this.convertDurationIntoISO(addRelationshipData.durationInDays);
            this.adminRelationshipPayLoad.accessDetails = this.getRoleDefinition();
            this.adminRelationshipPayLoad.autoExtendDuration = this.getAutoExtend(addRelationshipData.autoExtend);
            const subscription = this._adminRelationshipService.creatNewAdminRelationship(this.adminRelationshipPayLoad)
                .pipe(
                    catchError((err) => {
                        let errmsg: string = this._translateService.instant('TRANSLATE.' + err.error.ErrorMessage);
                        this._toastService.error(errmsg, {
                            timeOut: 10000
                        });
                        return of(null);
                    })
                ).subscribe((res: any) => {
                    if (res != null) {
                        let result = res.Data;
                        this.adminRelationhipDetails = result;
                        this.adminRelationhipDetails.durationInDays = this.getDurationInDays(this.adminRelationhipDetails?.duration);
                        this.getMicrosoftEntraRolesForDetails(this.adminRelationhipDetails.accessDetails.unifiedRoles);
                        this.buildMessage();
                        this.emailSubject = this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_FORM_REQUEST_SUBJECT_ADMIN_RELATIONSHIPS_REQUEST');
                        this.pageType = 'details';
                    }
                });
                this._subscriptionArray.push(subscription);
        }
    }

    getDurationInDays(input: string): number {
        // This regular expression extracts the number between 'P' and 'D'
        const regex = /P(\d+)D/;
        const match = input.match(regex);

        if (match && match[1]) {
            return parseInt(match[1], 10); // Convert the matched part to an integer
        } else {
            throw new Error('Invalid duration format');
        }
    }

    getMicrosoftEntraRolesForDetails(data: any[]) {
        this.microsoftEntraRolesFromDB.forEach((v: any) => {
            data.forEach((w: any) => {
                if (v.EntraRoleId == w.roleDefinitionId) {
                    this.microsoftEntraRolesForDetails.push(v);
                }
            })
        })
        this.commaSeparatedNames = this.getCommaSeparatedNames();
    }

    getCommaSeparatedNames(): string {
        return this.microsoftEntraRolesForDetails
            .map(item => item.Name)
            .join(', ');
    }

    hideCursorInNgSelect() {
        setTimeout(() => {
            const inputElement = document.querySelector('ng-select input');
            if (inputElement) {
                (inputElement as HTMLElement).blur();  // Remove focus after selection
            }
        }, 100);
    }

    compareItems(item1: any, item2: any) {
        return JSON.stringify(item1) == JSON.stringify(item2);
    }

    buildMessage() {
        this.microsoftEntraRolesForDetails.sort((a: any, b: any) => {
            return a.Name.localeCompare(b.Name);  // Sorting by 'Name' alphabetically
        });

        const formattedRolesText = this.microsoftEntraRolesForDetails
            .map(item => `${item.Name}\n${item.Description}\n`)
            .join('\n');
        /*
            Regex for replacing <br/> tag with new line 
        */
        let regex = /<br\s*[\/]?>/gi;
        //console.log(this.requestMessage);
        let htmlText: any = this._translateService.instant("TRANSLATE.ADMIN_RELATIONSHIPS_FORM_REQUEST_TEXT_CUSTOMERS", {
            adminRelatoshipDataId: this.adminRelationhipDetails.id,
            duration: this.getDurationInDays(this.adminRelationhipDetails.duration),
            entraRoles: formattedRolesText
        });
        this.requestMessage = $($("<div />").html(htmlText.replace(regex, "\n"))).text();
        this.encodedrequestMessage = encodeURIComponent(this.requestMessage);
    }
    onRequestMessageChange() {
        this.encodedrequestMessage = encodeURIComponent(this.requestMessage);
    }

    confirmCopy() {
        this.clipboard.copy(this.requestMessage);
        this._toastService.success(this._translateService.instant('TRANSLATE.ADMIN_RELATIONSHIPS_FORM_REQUEST_LABLE_COPIED_REQUEST_SUCCESSFULLY'))
    }

    cancel() {
        this._modalService.dismissAll();
    }

    checkEntraRoleConsistGlobalAdministartionRole() {
        let index = this.selectedEntraRoles.findIndex((v: any) => v.EntraRoleId == '62e90394-69f5-4237-9190-012177145e10');
        if (index > -1) {
            this.entraRoleGlobalAdministartionExist = true;
            this.addRelationshipForm.get('autoExtend')?.setValue(false);
            this.addRelationshipForm.get('autoExtend')?.disable();
        }
        else {
            this.entraRoleGlobalAdministartionExist = false;
            this.addRelationshipForm.get('autoExtend')?.enable();
        }
    }

    backToAdminRelatiosnhipsList() {
        this._router.navigate([`partner/adminrelationships`]);
    }

    ngOnDestroy(): void {
        this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
    }
}
