export class ReconciliationReportModel {
    SearchText : string;
    CustomerC3Id : string = '';
    StatusIds : string;
    CategoryIds : string;

}


export class  ReconciliationReportGroupModel {
    ServiceProviderCustomer : any;
    ServiceProviderCustomerId : any;
    CustomerSubscriptions : any;
    Provider : string;
    MisMatchCount : number = 0;
    IsExpanded : boolean;
}

export class GroupModel {
    ServiceProviderCustomer: string;
    CustomerSubscriptions: any;
    ServiceProviderCustomerId: number;
    Provider: string;
    MisMatchCount: number;
}

export class SearchModel {
    searchText: string = '';
    shouldShowOnlyMismatch: boolean = false; 
    shouldShowOnlyFixedInActive: boolean = false;
    categoryIds: string = '';
    statusIds: string = '';
    IsEmpty(): boolean {
        return this.searchText === '' && !this.shouldShowOnlyFixedInActive && !this.shouldShowOnlyMismatch && !this.categoryIds && !this.statusIds;
    }
}


