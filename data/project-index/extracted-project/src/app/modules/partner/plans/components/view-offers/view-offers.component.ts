import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { DynamicTemplateService } from 'src/app/services/dynamic-template.service';
import { PermissionService } from 'src/app/services/permission.service';
import { ProductService } from 'src/app/services/product.service';
import { C3BaseComponent } from 'src/app/shared/models/c3BaseComponent';
import { Tabs } from '../../model/plans.model';
import { AppSettingsService } from 'src/app/services/app-settings.service';
import _ from "lodash";
import { PlansListingService } from '../../services/plans-listing.service';

@Component({
  selector: 'app-view-offers', 
  templateUrl: './view-offers.component.html',
  styleUrl: './view-offers.component.scss'
})
export class ViewOffersComponent  extends C3BaseComponent implements OnInit, OnDestroy {
  planInfo:any;
  tabs = Tabs;
  activeTab: Tabs = this.tabs.Quantity; 


  constructor(private _commonService:CommonService, 
    public _permissionService:PermissionService,
    public _dynamicTemplateService:DynamicTemplateService,
    public _router: Router,
    private _appService: AppSettingsService,  
    public _productService: ProductService,
    public _planService: PlansListingService
  ){
    super(_permissionService,_dynamicTemplateService,_router, _appService); 
    this.planInfo = _commonService.getFromLocalStorge('planinfo');
  }
  
  ngOnInit(): void {
  }  
  
  setActiveTab(tab: Tabs) {
    this.activeTab = tab;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}