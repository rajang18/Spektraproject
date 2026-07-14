import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyConversionService } from 'src/app/services/currency-conversion.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { PlansListingService } from '../../services/plans-listing.service';
import { combineLatest, switchMap, takeUntil } from 'rxjs';
import { ADTSettings } from 'angular-datatables/src/models/settings'; 
import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap'; 
import { PageInfoService } from 'src/app/_c3-lib/layout';
import { TranslateService } from '@ngx-translate/core';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import { C3RouterService } from 'src/app/services/c3-router.service';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-currency-conversion', 
  templateUrl: './currency-conversion.component.html',
  styleUrl: './currency-conversion.component.scss'
})
export class CurrencyConversionComponent extends C3BaseComponent implements OnInit, OnDestroy {
  planId:string;
  pageMode = "DefineTargetCurrency";
  targetCurrencyCount:number|null;
  planInfo:any;
  planTargetCurrency:any=null;
  searchCriteria:any={};
  targetCurrencyCode:any;
  currencyConvertRate:number=0;
  currencyCodes:any[] =[]; 
  datatableConfig: ADTSettings;
  planProductsDataSource:any[] = [];
  touched:boolean = false;


  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-top mw-700px',
  };

  @ViewChild('planName') planName: TemplateRef<any>; 
  @ViewChild('salePrize') salePrize: TemplateRef<any>; 
  

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private _cdref: ChangeDetectorRef,  
    private _planService:PlansListingService,
    private pageInfo: PageInfoService,
    private _currencyConversionService: CurrencyConversionService,
    public _router: Router,
    public _permissionService:PermissionService,
    public _dynamicTemplateService:DynamicTemplateService,
    public _translateService:TranslateService,
    private _appService: AppSettingsService,
    private c3RouterService:C3RouterService,
    private _commmonService: CommonService,
  ) { 
      super(_permissionService,_dynamicTemplateService,_router, _appService); 
      this.navigation = this._router.getCurrentNavigation();
      this.planId = this.navigation?.extras.state?.['planId'];
      if(this.planId == undefined || this.planId == null){
        this._router.navigate([`partner/plans`]);
      }
  }

  ngOnInit(): void {
    let menuTitle:any = this._commmonService.entityName.toLowerCase() === 'reseller' ? 'SIDEBAR_TITLE_MENUS_SELLER_INDIRECT' : 'SIDEBAR_TITLE_MENUS_SELL_DIRECT'
    this.pageInfo.updateBreadcrumbs([menuTitle, 'BUTTON_MANAGE_PRODUCT',''])
    this.pageInfo.updateTitle(this._translateService.instant("TRANSLATE.PARTNER_PLAN_PRODUCT_CURRENCY_CONVERSION_LABEL_TEXT_DEFINE_PLAN_IN_NEW_CURRENCY"), true);
    const subscription = combineLatest([
      this._planService.getPlanDetails(this.planId),
      this._currencyConversionService.getCodes()
    ]).pipe(takeUntil(this.destroy$),
      switchMap(([res,curencyCode])=>{
        this.currencyCodes = curencyCode;
        this.planInfo = res;
        return this._currencyConversionService.getTargetCurrencies(res.CurrencyCode?.toString())
      })
    ).subscribe(res=>{
      this.targetCurrencyCode = res;
      if (this.targetCurrencyCode !== undefined && this.targetCurrencyCode !== null) {
        this.targetCurrencyCount = this.targetCurrencyCode.length;
      } 
      this._cdref.detectChanges();
    })
    this._subscriptionArray.push(subscription);
  } 

  loadOffers() {
    this.touched = true; 
    if (this.planTargetCurrency) {
        this.searchCriteria.PlanId = this.planId;
        this.searchCriteria.TargetCurrencyCode = this.planTargetCurrency.TargetCurrency; 
       // this.targetCurrencyCode = this.planTargetCurrency;
        this.currencyConvertRate =   this.targetCurrencyCode.find((v:any)=>v.TargetCurrency == this.planTargetCurrency).ConversionRate;
        this.UpdatePageMode('DefinePlanprices');
        //this._router.navigate([`partner/plans/planproductcurrencyconversionlst`]);
       // this.handleTableConfig()
    }
  }

  UpdatePageMode(mode:string){
    this.pageMode = mode;
  }  

  onCurrencyChange(value: string | null): void {
    this.touched = true;
    this.planTargetCurrency = value;
    //console.log(this.planTargetCurrency)
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  backToPlan(){
    this.c3RouterService.backToHistory(this.keyForData,`partner/plans`);
  }

}
