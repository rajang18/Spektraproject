import { Injectable, ComponentFactoryResolver, ViewContainerRef, Type, EventEmitter, ComponentRef } from '@angular/core';
import { CustomInputsMap } from '../shared/models/custom-input-map';
import { ComponentMap } from '../shared/models/common';

@Injectable({
  providedIn: 'root'
})
export class TenantLoaderService {
  private loadedComponents: ComponentMap[] = [];
  constructor(private resolver: ComponentFactoryResolver) { }

  loadComponent(viewContainerRef: ViewContainerRef, componentType: Type<any>, key: string , data:any, form:any, controlName:any, cc:any, savetenantconfig: EventEmitter<any>, reverttenantconfig: EventEmitter<any>,canceltenantconfig: EventEmitter<any>, smtpChange:EventEmitter<any>) {
    const factory = this.resolver.resolveComponentFactory(componentType);
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(factory);
    componentRef.instance.widgetKey = key;
    componentRef.instance.data = data;

    componentRef.instance.form = form;
    componentRef.instance.frmControlName = controlName;
    componentRef.instance.saveTenant = savetenantconfig;
    componentRef.instance.revertTenant = reverttenantconfig;
    componentRef.instance.canceltenant = canceltenantconfig;
    componentRef.instance.cc = cc;
    componentRef.instance.smtpOptionChange = smtpChange;
    this.addLoadedComponents(key, componentRef); 

  }

  unloadAllComponent() {
    if(this.loadedComponents != null && this.loadedComponents.length > 0){
      this.loadedComponents.forEach(v=>{
        var component = v.name; 
        var c = v.value;
        c.destroy();
      })
      this.loadedComponents = [];
    }
  }

  addLoadedComponents(key: string, componentRef: ComponentRef<any>) {
    this.loadedComponents.push({
      name: key,
      value: componentRef
    });
  }
  

  getComponentType(key: string): Type<any> | undefined {
    return CustomInputsMap.get(key.toLowerCase());
  }
}
