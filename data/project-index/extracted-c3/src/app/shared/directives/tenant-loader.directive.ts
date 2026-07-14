import { ComponentFactoryResolver, Directive, EventEmitter, Input, OnDestroy, OnInit, Output, ViewContainerRef } from '@angular/core';
import { TenantLoaderService } from '../../services/tenant-loader.service';
import { PermissionService } from 'src/app/services/permission.service';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { CloudHubConstants } from '../models/constants/cloudHubConstants';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'tenantconfig',
  standalone: true
})
export class TenantLoadDirective implements OnInit, OnDestroy {
  @Input() data: any;
  // form 
  @Input() form: any;
  // form control name
  @Input() frmControlName: any;
  @Input() controlType: any;
  @Input() metadata:any;
  // @Input() controlType: string | null =''
  @Output() controltype: EventEmitter<any>;
  @Output() reverttenantconfig: EventEmitter<any> = new EventEmitter();
  @Output() savetenantconfig: EventEmitter<any> = new EventEmitter();
  @Output() canceltenantconfig: EventEmitter<any> = new EventEmitter();
  @Output() smtpOptionChange: EventEmitter<any> = new EventEmitter();

  
  cc: any = {}

  constructor(
    private viewContainerRef: ViewContainerRef,
    private tenantLoaderService: TenantLoaderService,
    private _permissionService: PermissionService,
    private _router: Router,
    private _commonService:CommonService

  ) {
    this.cc.Permissions = {
      HasOverRideConfiguration: "Denied",
      HasSaveConfiguration: "Denied",
      HasRevertConfiguration: "Denied",
      HasTabConfigurationsManagedByCustomer: "Denied",
      HasTabConfigurationsManagedByReseller: "Denied",
      HasUpdateConfigurationsManagedByCustomer: "Denied",
      HasUpdateConfigurationsManagedByReseller: "Denied",
    };
    this.cc.EntityName = _commonService.entityName;
    this.hasPermission();
    
    /*Need to change this condition once all the configuration page implemented */
    //"partner.tenantconfigurations" 
    if (_router.url.includes("customerconfiguration") || _router.url.includes("resellerconfiguration") || _router.url.includes('configurationsetting') ) {
      this.cc.IsTenantConfiguration = true;
    }
  }

  ngOnInit(): void {
    /* metadata */
    this.cc.cpvApplicationID = this.metadata?.cpvApplicationID;
    const componentType = this.tenantLoaderService.getComponentType(this.controlType);
    if (componentType) {
      this.tenantLoaderService.loadComponent(this.viewContainerRef, componentType, this.controlType, this.data, this.form, this.frmControlName, this.cc, this.savetenantconfig, this.reverttenantconfig, this.canceltenantconfig, this.smtpOptionChange);
    }
  }

  hasPermission() {
    this.cc.Permissions.HasOverRideConfiguration = this._permissionService.hasPermission('BTN_OVERRIDE_CUSTOMER_CONFIGURATION');
    this.cc.Permissions.HasSaveConfiguration = this._permissionService.hasPermission('BTN_SAVE_CUSTOMER_CONFIGURATION');
    this.cc.Permissions.HasRevertConfiguration = this._permissionService.hasPermission('BTN_REVERT_CUSTOMER_CONFIGURATION');
    this.cc.Permissions.HasTabConfigurationsManagedByCustomer = this._permissionService.hasPermission(CloudHubConstants.TABCONFIGURATIONSMANAGEDBYCUSTOMER);
    this.cc.Permissions.HasTabConfigurationsManagedByReseller = this._permissionService.hasPermission(CloudHubConstants.TABCONFIGURATIONSMANAGEDBYRESELLER);
    this.cc.Permissions.HasUpdateConfigurationsManagedByCustomer = this._permissionService.hasPermission(CloudHubConstants.UPDATECONFIGURATIONSMANAGEDBYCUSTOMER);
    this.cc.Permissions.HasUpdateConfigurationsManagedByReseller = this._permissionService.hasPermission(CloudHubConstants.UPDATECONFIGURATIONSMANAGEDBYRESELLER);
  }

  ngOnDestroy(): void {
    this.tenantLoaderService.unloadAllComponent();
  }
}
