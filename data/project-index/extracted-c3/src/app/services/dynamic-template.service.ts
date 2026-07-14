import { ComponentFactoryResolver, ComponentRef, Injectable, TemplateRef, Type, ViewContainerRef } from '@angular/core';
import { Subject } from 'rxjs';  
import { ComponentMap } from '../shared/models/common';

@Injectable({
  providedIn: 'root'
})
export class DynamicTemplateService {
  private loadedComponents: ComponentMap[] = [];

  constructor(private componentFactoryResolver: ComponentFactoryResolver){
    
  }

  private templateSubject = new Subject<TemplateRef<any>|null>();
  public template$ = this.templateSubject.asObservable();

  sendTemplate(template: TemplateRef<any>|null) {
    this.templateSubject.next(template);
  } 

  loadComponent(dynamicHost:ViewContainerRef, widgetMap:Map<string, Type<any>>, key:string, properties: { [key: string]: any }|null = null, uniqueId = null): any {
    let DynamicComponent = widgetMap.get(key);
    if(DynamicComponent){
      const viewContainerRef = dynamicHost;
      viewContainerRef.clear();
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(DynamicComponent);
      const componentRef = viewContainerRef.createComponent(componentFactory);
      // Set properties on the component instance
      if(properties){
        try{
          Object.keys(properties).forEach(prop => {
            componentRef.instance[prop] = properties[prop];
          });
          //componentRef.instance.cdRef.detectChanges();
        }
        catch(e){
          console.error(e)
        }
      }
      if(!uniqueId){
        uniqueId = this.guid(key);   
      } 
      this.addLoadedComponents(uniqueId,componentRef)
      return componentRef;
    }
  } 

  guid(key: string, length: number = 25): string {
    const keyLen: number = key ? key.length : 0;
    const randomLength = length - keyLen;
  
    const randomString = Array.from({ length: randomLength }, () =>
      Math.floor(Math.random() * 36).toString(36) // Using base-36 for alphanumeric
    ).join('');
  
    return `${key}_${randomString}`;
  } 

  unloadAllComponent(name:string = null) {
    if(this.loadedComponents != null && this.loadedComponents.length > 0){
      this.loadedComponents.forEach(v=>{
        if(name){
          if(v.name == name){
            var c = v.value;
            c.destroy();
            this.loadedComponents = this.loadedComponents.filter(v=>v.name != name)
          } 
        }else{ 
          var c = v.value;
          c.destroy();
        }
      })
      if(!name){
        this.loadedComponents = [];
      }
    }
  }
  
  addLoadedComponents(key: string, componentRef: ComponentRef<any>) {
    this.loadedComponents.push({
      name: key,
      value: componentRef
    });
  }
}
