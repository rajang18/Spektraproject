import { AfterViewInit, Directive, ElementRef, SimpleChanges, OnChanges, TemplateRef, ViewChild, inject, ChangeDetectorRef, AfterViewChecked } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, Subscription } from "rxjs";
import { DynamicTemplateService } from "src/app/services/dynamic-template.service";
import { PermissionService } from "src/app/services/permission.service";
import { CloudHubConstants } from "./constants/cloudHubConstants";
import { AppSettingsService } from "src/app/services/app-settings.service";
import { FormGroup } from "@angular/forms";
import { LoaderService } from "src/app/services/loader.service";
@Directive()
export abstract  class C3BaseComponent implements AfterViewInit, OnChanges {

    showEditName: boolean = false;
    public permissionlst:string[] =[];
    private permissionStatus:string;
    public  redirectUrl:string = "/";
    _subscription: Subscription;
    public _subscriptionArray: Subscription[] = []; 
    destroy$ = new Subject<void>();
    stopSkelton:boolean = false;
    searchParams:any = null;
    keyForData:string;
    get cloudHubConstants() {
        return CloudHubConstants;
    }
    public defaultPageCount:number = 10;
    public navigation : any;
    
    formBuilderGroupName: string;
    isActionHeaderSet:boolean = false

    c3Table : any;

    @ViewChild('actionHeader', { static: true }) childTemplate: TemplateRef<any>|null = null;
    @ViewChild('fieldName') fieldName!: ElementRef;
    public loaderService = inject(LoaderService);

    constructor(public _permissionService:PermissionService,
        public _dynamicTemplateService:DynamicTemplateService,
        public _router: Router,
        protected _appSettingsService:AppSettingsService)
    {
        this.defaultPageCount = this._appSettingsService.$rootScope.DefaultPageCount;
        this.navigation = _router.getCurrentNavigation();
    }

    ngAfterViewInit(): void {
        if(!this.keyForData){
            this.keyForData = this.navigation?.extras.state?.['keyForData']; 
        }
        
        setTimeout(() => {
            if(this.childTemplate){
                this.actionHeaderLoader();
            }        
        },100)
        
    }
 
    ngOnChanges(changes :SimpleChanges){
        this.permissionCheck();
    }
    onShoweditButtonBlur() {
        this.showEditName = false;
    }

    onShowEditName() {
        this.showEditName = true;
        setTimeout(() => {
            this.fieldName.nativeElement.focus();
        }, 100)
    }
    
    permissionCheck(){
        if(this.permissionlst.length > 0){
            this.permissionlst.forEach(v=>{
                if(this.permissionStatus == "Allowed"){
                    this.permissionStatus = this._permissionService.hasPermission(v);
                } 
            })
            if(this.permissionStatus != "Allowed"){
                this._router.navigate([this.redirectUrl]);
            }
        }
        
    }

    escapeHtml(text: string): string {
        if (!text) return '';
        return String(text)
          .replace(/&/g, '&amp;')   // Escape &
          .replace(/</g, '&lt;')    // Escape <
          .replace(/>/g, '&gt;')    // Escape >
          .replace(/"/g, '&quot;')  // Escape "
          .replace(/'/g, '&#39;');  // Escape '
    }

    applyEscapeHTML(data: any) {
        if (Array.isArray(data) && data.length > 0) {
            data.forEach(property => {
            for (const propertyName in property) {
                if (property.hasOwnProperty(propertyName)) {
                const value = property[propertyName];
                if (typeof value === 'string') {
                    property[propertyName] = this.escapeHtml(value);
                }
                }
            }
            });
        }
    }
 
 
    

    actionHeaderLoader(){
        // if(this.childTemplate){
        //     this._dynamicTemplateService.sendTemplate(this.childTemplate);
        // } 
        if(this.childTemplate){
            this._dynamicTemplateService.sendTemplate(this.childTemplate);
        }
    }

    ngOnDestroy(): void {
        this._subscription?.unsubscribe();
        this.destroy$.next();
        this.destroy$.complete();
        this._subscriptionArray?.forEach((sb) => sb.unsubscribe());
        this._dynamicTemplateService.sendTemplate(null);
    }

    getTimes(n: number): any[] {
        return new Array<number>(Math.floor(n));
    }

    onLazyLoad(item: any) {
        item.loaded = true;  
    }

    persistPropertySet(){
        if (this.searchParams) {
            for (const propertyName in this.searchParams) {
                if (this.searchParams.hasOwnProperty(propertyName)) {
                // Set the property dynamically if it exists on the component
                    this.setPropertyIfExists(propertyName, this.searchParams[propertyName]);
                }
            }
           // this.C3cdRef.detectChanges();
        }
    }

    private setPropertyIfExists(propertyName: string, value: any) {
        // Check if the property exists on the component and set it
        if (propertyName in this) {
          this[propertyName] = value;
        }
    }

    isDirtyCheck(){
        Object.keys((this[this.formBuilderGroupName] as FormGroup).controls).forEach(v=>{
            let control= (this[this.formBuilderGroupName]as FormGroup).controls[v];
            if(!control.touched){
                control.markAsPristine()
            }
        })
    }
    onTableReady(dtElement:any){
        if(dtElement){
            this.c3Table = dtElement;
        } 
    }
}
