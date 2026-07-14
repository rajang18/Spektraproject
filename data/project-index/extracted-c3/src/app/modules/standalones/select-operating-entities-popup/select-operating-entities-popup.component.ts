import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import _ from 'lodash';
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@Component({
    selector: 'app-select-operating-entities-popup',
    standalone: true,
    imports: [NgbModule, TranslateModule,C3CommonModule, CommonModule, C3CommonModule, FormsModule, InfiniteScrollModule],
    templateUrl: './select-operating-entities-popup.component.html',
    styleUrl: './select-operating-entities-popup.component.scss'
})
export class SelectOperatingEntitiesPopupComponent implements OnInit {
    sites: any[];
    departments: any[];
    domains: any[];
    customerName: any;
    siteName: any;
    HasManageProductSubscriptionOwnership: string;
    selectedSites: any[] = [];
    selectedDepartments = [];
    selectedDomains = [];
    includeChildEntities: any;
    isCustomerSelected: any;
    isSiteSelected: any;
    operatingEntity: any;
    entityName: string
    IsCustomerSelectedForFilter : any = false;
    includeZeroQuantites: any;
    get SelectedDomainsForCustomerProducts() {
        return localStorage.getItem("SelectedDomainsForCustomerProducts");
    }

    get IsIncludeChildEntitiesFilterSelected() {
        return localStorage.getItem("IsIncludeChildEntitiesFilterSelected");
    }

    // get CustomerName() {
    //     return localStorage.getItem("IsSiteSelectedForFilter");
    // }
    // get IsSiteSelectedForFilter() {
    //     return localStorage.getItem("IsSiteSelectedForFilter");
    // }


    constructor(private _modalService: NgbModal,
        private _activeModal: NgbActiveModal,
        private _cdref: ChangeDetectorRef
    ) {    }
    
    ngOnInit(): void {
        this.setData();
    }


    setData() {
        if (localStorage.getItem("SelectedSitesForCustomerProducts") !== undefined && localStorage.getItem("SelectedSitesForCustomerProducts") !== null && localStorage.getItem("SelectedSitesForCustomerProducts") !== '') {
            let sitesSelectedByUser = localStorage.getItem("SelectedSitesForCustomerProducts");
            let selectedSitesList = sitesSelectedByUser.split(',');
            _.each(this.sites, site => {
                let matchingSiteIndexInSelectedSites = _.indexOf(selectedSitesList, site.C3SiteID);
                if (matchingSiteIndexInSelectedSites !== undefined && matchingSiteIndexInSelectedSites !== null && matchingSiteIndexInSelectedSites >= 0) {
                    site.selected = true;
                    this.selectedSites.push(site.C3SiteID);
                }
            });
            this.sites.forEach(site => {
                if (selectedSitesList.includes(site.C3SiteID)) {
                    site.selected = true;
                    this.selectedSites.push(site.C3SiteID);
                }
            });
        }

        if (localStorage.getItem("SelectedDepartmentsForCustomerProducts") !== undefined && localStorage.getItem("SelectedDepartmentsForCustomerProducts") !== null && localStorage.getItem("SelectedDepartmentsForCustomerProducts") !== '') {
            let departmentsSelectedByUser = localStorage.getItem("SelectedDepartmentsForCustomerProducts");
            let selectedDepartmentsList = departmentsSelectedByUser.split(',');
            if (this.departments !== undefined && this.departments !== null && this.departments.length > 0) {
                _.each(this.departments, department => {
                    let matchingDepartmentIndexInSelectedDepartments = _.indexOf(selectedDepartmentsList, department.C3DepartmentSitesID);
                    if (matchingDepartmentIndexInSelectedDepartments !== undefined && matchingDepartmentIndexInSelectedDepartments !== null && matchingDepartmentIndexInSelectedDepartments >= 0) {
                        department.selected = true;
                        this.selectedDepartments.push(department.C3DepartmentSitesID);
                    }
                });
            }
            else {
                _.each(this.sites, site => {
                    _.each(site.Departments, department => {
                        let matchingDepartmentIndexInSelectedDepartments = _.indexOf(selectedDepartmentsList, department.C3DepartmentSitesID);
                        if (matchingDepartmentIndexInSelectedDepartments !== undefined && matchingDepartmentIndexInSelectedDepartments !== null && matchingDepartmentIndexInSelectedDepartments >= 0) {
                            department.selected = true;
                            this.selectedDepartments.push(department.C3DepartmentSitesID);
                        }
                    });
                });
            }
        }
        
        if (localStorage.getItem("SelectedDomainsForCustomerProducts") !== undefined && localStorage.getItem("SelectedDomainsForCustomerProducts") !== null && localStorage.getItem("SelectedDomainsForCustomerProducts") !== '') {
            let domainsSelectedByUser = this.SelectedDomainsForCustomerProducts;
            let selectedDomainsList = domainsSelectedByUser.split(',');
            _.each(this.domains, domain => {
                let matchingDomainIndexInSelectedDomains = _.indexOf(selectedDomainsList, domain.DomainName);
                if (matchingDomainIndexInSelectedDomains !== undefined && matchingDomainIndexInSelectedDomains !== null && matchingDomainIndexInSelectedDomains >= 0) {
                    domain.selected = true;
                    this.selectedDomains.push(domain.DomainName);
                }
            });
        }

        if (localStorage.getItem("IsCustomerSelectedForFilter") !== undefined && localStorage.getItem("IsCustomerSelectedForFilter") !== null && localStorage.getItem("IsCustomerSelectedForFilter") !== '') {
            this.IsCustomerSelectedForFilter = localStorage.getItem("IsCustomerSelectedForFilter");
            if (this.IsCustomerSelectedForFilter === 'false') {
                this.isCustomerSelected = false;
            }
            if (this.IsCustomerSelectedForFilter === 'true') {
                this.isCustomerSelected = true;
            }
        }

        if (this.IsIncludeChildEntitiesFilterSelected !== undefined && this.IsIncludeChildEntitiesFilterSelected !== null && this.IsIncludeChildEntitiesFilterSelected !== '') {
            if (this.IsIncludeChildEntitiesFilterSelected === 'false') {
                this.includeChildEntities = false;
            }
            if (this.IsIncludeChildEntitiesFilterSelected === 'true') {
                this.includeChildEntities = true;
            }
        }

        if (localStorage.getItem("CustomerName") !== undefined && localStorage.getItem("CustomerName") !== null && localStorage.getItem("CustomerName") !== '') {
            let customerName = localStorage.getItem("CustomerName");
            this.customerName = customerName;
        }

        if (localStorage.getItem("IsSiteSelectedForFilter") !== undefined && localStorage.getItem("IsSiteSelectedForFilter") !== null && localStorage.getItem("IsSiteSelectedForFilter") !== '') {
            this.isSiteSelected = localStorage.getItem("IsSiteSelectedForFilter") ;
            if (this.isSiteSelected === 'false') {
                this.isSiteSelected = false;
            }
            if (this.isSiteSelected === 'true') {
                this.isSiteSelected = true;
            }
        }
        

        if (localStorage.getItem("SiteName") !== undefined && localStorage.getItem("SiteName") !== null && localStorage.getItem("SiteName") !== '') {
            let siteName = localStorage.getItem("SiteName");
            this.siteName = siteName;
        }
        else {
            if (this.departments.length > 0) {
                this.siteName = this.departments[0].SiteName;
                localStorage.setItem("SiteName", this.siteName);
            }
        }
    }

    toggleOperatingEntitySelect(operatingEntity: any, type: string) {
        if (type === 'Site' && operatingEntity.selected) {
            operatingEntity.selected = false;
            this.selectedSites = _.filter(this.selectedSites, site => site !== operatingEntity.C3SiteID);
            if (this.includeChildEntities) {
                operatingEntity.Departments = _.map(operatingEntity.Departments, each => {
                    each.selected = false;
                    return each;
                });
                this.selectedDepartments = _.filter(this.selectedDepartments, department => !_.find(operatingEntity.Departments, { C3DepartmentSitesID: department }));
            }
        }
        else if (type === 'Site' && !operatingEntity.selected) {
            operatingEntity.selected = true;
            this.selectedSites.push(operatingEntity.C3SiteID);
            if (this.includeChildEntities) {
                _.each(operatingEntity.Departments, each => {
                    each.selected = true;
                    this.selectedDepartments.push(each.C3DepartmentSitesID);
                });
            }
        }
        else if (type === 'Department' && operatingEntity.selected) {
            operatingEntity.selected = false;
            this.selectedDepartments = _.filter(this.selectedDepartments, dept => dept !== operatingEntity.C3DepartmentSitesID);
        }
        else if (type === 'Department' && !operatingEntity.selected) {
            if (!this.operatingEntity) { this.operatingEntity = { selected: true } }
            this.operatingEntity['selected'] = true;
            this.selectedDepartments.push(operatingEntity.C3DepartmentSitesID);
        }
    }

    updateSelectionForChildEntities() {
        if (this.includeChildEntities) {
            this.includeChildEntities = false;
        } else {
            this.includeChildEntities = true;
        }
    }

    customerSelected() {
        this.isCustomerSelected = !this.isCustomerSelected;
        if (this.isCustomerSelected === true && this.includeChildEntities === true) {
            _.each(this.sites, site => {
                site.selected = true;
                this.selectedSites.push(site.C3SiteID);
                _.each(site.Departments, department => {
                    department.selected = true;
                    this.selectedDepartments.push(department.C3DepartmentSitesID);
                });
            });
        }
        if (this.isCustomerSelected === false && (this.includeChildEntities === true)) {
            this.sites = _.map(this.sites, site => {
                site.selected = false;
                site.Departments = _.map(site.Departments, department => {
                    department.selected = false;
                    return department;
                });
                return site;
            });
            this.departments = _.map(this.departments, each => {
                each.selected = false;
                return each;
            });

            this.selectedSites = [];
            this.selectedDepartments = [];
        }
    }

    siteSelected() {
        if (this.isSiteSelected === true && this.includeChildEntities === true) {
            _.each(this.departments, department => {
                department.selected = true;
                this.selectedDepartments.push(department.C3DepartmentSitesID);
            });
        }
        if (this.isSiteSelected === false && (this.includeChildEntities === true)) {
            this.departments = _.map(this.departments, each => {
                each.selected = false;
                return each;
            });

            this.selectedDepartments = [];
        }
    }
    cancel() {
        this._modalService.dismissAll();
    }

    clearSelection() {
        this.sites = _.map(this.sites, site => {
            site.selected = false;
            site.Departments = _.map(site.Departments, department => {
                department.selected = false;
                return department;
            });
            return site;
        });
        this.departments = _.map(this.departments, each => {
            each.selected = false;
            return each;
        });
        this.domains = _.map(this.domains, each => {
            each.selected = false;
            return each;
        });
        this.selectedSites = [];
        this.selectedDepartments = [];
        this.selectedDomains = [];

        this.isCustomerSelected = false;
        this.includeChildEntities = false;
        this.isSiteSelected = false;
        this.includeZeroQuantites = true;
        this.setToLocalStorage();
    }

    preProcessFilterProductsBySitesAndDepartments() {
        this.selectedDomains = _.map(this.domains, each => {
            if (each.selected === true) {
                return each.DomainName;
            }
        }).filter(e => e !== undefined);
        this.setToLocalStorage();
        let result = { SelectedSites: this.selectedSites, SelectedDepartments: this.selectedDepartments, SelectedDomains: this.selectedDomains, IsCustomerSelected: this.isCustomerSelected, IsSiteSelected: this.isSiteSelected, IncludeZeroQuantites: this.includeZeroQuantites };
        this._activeModal.close(result);
    }

    setToLocalStorage() {
        let selectedSitesCSV = this.selectedSites.join(',');
        let selectedDepartmentsCSV = this.selectedDepartments.join(',');
        let selectedDomainsCSV = this.selectedDomains.join(',');
        localStorage.setItem("SelectedSitesForCustomerProducts", selectedSitesCSV);
        localStorage.setItem("SelectedDepartmentsForCustomerProducts", selectedDepartmentsCSV);
        localStorage.setItem("SelectedDomainsForCustomerProducts", selectedDomainsCSV);
        localStorage.setItem("IsCustomerSelectedForFilter", this.isCustomerSelected);
        localStorage.setItem("IsIncludeChildEntitiesFilterSelected", this.includeChildEntities);
        localStorage.setItem("IsSiteSelectedForFilter", this.isSiteSelected);
        localStorage.setItem("IsIncludeZeroQuantitiesSelected", this.includeZeroQuantites);
    }

    updateSelectionForIncludingZeroQuantities() {
        if (this.includeZeroQuantites) {
            this.includeZeroQuantites = false;
            localStorage.setItem("IsIncludeZeroQuantitiesSelected", "false");
        } else {
            this.includeZeroQuantites = true;
            localStorage.setItem("IsIncludeZeroQuantitiesSelected", "true");
        }
    }
}
