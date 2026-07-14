import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import _ from 'lodash';
import { Subject, takeUntil } from 'rxjs';
import { AzureEstimatesService } from 'src/app/services/azure-estimates.service';

@Component({
  selector: 'app-azure-estimates-level-two',
  templateUrl: './azure-estimates-level-two.component.html',
  styleUrl: './azure-estimates-level-two.component.scss'
})
export class AzureEstimatesLevelTwoComponent implements OnInit, OnDestroy {

  @Input() row:any;
  @Input() searchData:any;
  @Input() serachInput:any;
  @Input() currentCurrency:any;
  @Input() IsFixedPrice:any;
  @Input() currentSubscriptionId:any;
  @Input() isPartnerLevel:any;
  @Input() currentGroup:any;
  @Input() currentC3CustomerId:any;
  @Input() billingPeriodId:any;
  @Input() currentEntitlementId:any;
  @Input() currentDate:any;
  @Input() selectedServiceProviderCustomer:any;
  @Input() currentCurrencyCode:any;
  @Input() isAzureReportingPCStandardizationEnabled: boolean = false;

  
  _unsubscribe:any = [];
  isGridLoading1:any = true;
  isGridLoading2:any = true;
  destroy$ = new Subject<void>();
  


  constructor(private _cdRef:ChangeDetectorRef,
    private azureEstimatesService:AzureEstimatesService,
  ){

    

  }

  ngOnInit(): void {
    
    // fetch the stuff
      this._cdRef.detectChanges();
      this.GetResourceGroupDetails();
  }


  GetResourceGroupDetails() {
    
    this.isGridLoading1  = true;
    this.isGridLoading2 = true;
    if (this.row.Rows === undefined || this.row.Rows.length == 0) {
        this.row.IsAscending = true;
        var resourceGroup = this.row.ResourceGroup !== null && this.row.ResourceGroup !== '' ? this.row.ResourceGroup : '1';
        var serachData = this.searchData;
        var reqBody = {
            searchCriteria: JSON.stringify(serachData)
        };
    let sub =   this.azureEstimatesService.GetAzureEsitamteService(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
          this.isGridLoading1  = false;
          // initially for higher level the order is ascending by default
          this.row.Rows = _.orderBy(Data,'ChargeForCustomer','asc');
          // this.azureEstimateSortElementList[row.ResourceGroup] = 'ChargeForCustomer';
          // this.azureEstimateReverseSort[row.ResourceGroup] = false;
        })
        this._unsubscribe.push(sub);
        var resourceUri = this.row.ResourceUri !== null && this.row.ResourceUri !== '' ? this.row.ResourceUri : null;
        var serachInput = this.serachInput;

    let sub2 =    this.azureEstimatesService.GetAzureEstimateAudit(serachInput).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
          this.isGridLoading2  = false;
          this.row.Audit = Data;
        });
        this._unsubscribe.push(sub2);
    }
    this.row.ShowRows= true;
    this._cdRef.detectChanges();
  }


  GetResourceGroupDetailsV2(row){
    // take index
    if(row.Rows == undefined){
      
      // row.isAcending = 
      row.IsAscending2 = true;

      


     // var something  = this.row?.Rows?.Rows
     var resourceGroup = row.ResourceGroup !== null && row.ResourceGroup !== '' ? row.ResourceGroup : '-1';
     var resourceGuid = row.ResourceGuid !== null && row.ResourceGuid !== '' ? row.ResourceGuid : '-1';
     var resourceName = row.ResourceName !== null && row.ResourceName !== '' ? row.ResourceName : '-1';
     var serachData =
     {
         GroupId: this.currentGroup,
         SubscriptionId: this.currentSubscriptionId == '' ? null : this.currentSubscriptionId,
         BillingPeriodId: this.billingPeriodId,
         EntitlementId: this.currentEntitlementId,
         Date: this.currentDate,
         ResourceGroup: resourceGroup,
         ResourceGuid: resourceGuid,
         ResourceName: resourceName,
         CustomerId: this.currentC3CustomerId,
         ServiceProviderCustomerId: this.selectedServiceProviderCustomer?.CustomerRefId,
         CurrencyCode: this.currentCurrencyCode,
         ProviderId: this.selectedServiceProviderCustomer.ProviderId
     };
     var reqBody = {
         searchCriteria: JSON.stringify(serachData)
     };


     let sub = this.azureEstimatesService.GetAzureEstimateResource(reqBody).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
      
      this.isGridLoading1  = false;
      row.Rows = _.orderBy(Data,'ChargeForCustomer','asc');;
      // this.azureEstimateSortElementList[row.ResourceGroup] = 'ChargeForCustomer';
      // this.azureEstimateReverseSort[row.ResourceGroup] = false;
    })
    this._unsubscribe.push(sub);

     var resourceUri = row.ResourceUri !== null && row.ResourceUri !== '' ? row.ResourceUri : null;
     var serachInput =
     {
         ProviderCustomerId: this.selectedServiceProviderCustomer.CustomerRefId,
         CustomerC3Id: this.currentC3CustomerId,
         SubscriptionId: row.EntitlementId !== null && row.EntitlementId !== '' ? row.EntitlementId : row.SubscriptionId,
         StartMonth: this.currentDate !== null ? this.currentDate.getMonth() : null,
         StartDate: this.currentDate !== null ? this.currentDate.getDate() : null,
         StartYear: this.currentDate !== null ? this.currentDate.getYear() : null,
         ResourceGroupName: resourceGroup,
         ResourceUri: resourceUri,
         CurrencyCode: this.currentCurrencyCode,
         ProviderId: this.selectedServiceProviderCustomer.ProviderId
     };
     
      let sub2 =    this.azureEstimatesService.GetAzureEstimateAudit(serachInput).pipe(takeUntil(this.destroy$)).subscribe(({Data}:any)=>{
        this.isGridLoading2  = false;
        row.Audit = Data;
      });
      this._unsubscribe.push(sub2);
    }
    row.ShowRows = !row.ShowRows;
  }

  
  ngOnDestroy(): void {
      
  }


  sortData(row:any){
    
    row.IsAscending = !row.IsAscending;
    
    row.Rows = _.orderBy(row.Rows,"ChargeForCustomer",  row.IsAscending ? 'asc':'desc')
  }

  sortDataByMultipleKeys(row:any, key:any){
    

    row.IsAscending2 = !row.IsAscending2;

    row.Rows = _.orderBy(row.Rows, key,  row.IsAscending2 ? 'asc': 'desc');

  }





}
