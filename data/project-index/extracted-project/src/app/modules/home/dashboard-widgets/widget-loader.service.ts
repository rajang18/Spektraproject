import { Injectable, ComponentFactoryResolver, ViewContainerRef, Type, ComponentRef } from '@angular/core';
import { WidgetMap } from './widget-map';
import { ComponentMap } from 'src/app/shared/models/common';

@Injectable({
  providedIn: 'root'
})
export class WidgetLoaderService {
  private loadedComponents: ComponentMap[] = [];
  constructor(private resolver: ComponentFactoryResolver) { }

  loadComponent(viewContainerRef: ViewContainerRef, componentType: Type<any>, key: string) {
    const factory = this.resolver.resolveComponentFactory(componentType);
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(factory);
    componentRef.instance.widgetKey = key;

    this.addLoadedComponents(key, componentRef); 
  }

  addLoadedComponents(key: string, componentRef: ComponentRef<any>) {
    this.loadedComponents.push({
      name: key,
      value: componentRef
    });
  }

  unloadAllComponent() {
    if(this.loadedComponents != null && this.loadedComponents.length > 0){
      this.loadedComponents.forEach(v=>{ 
        var c = v.value;
        c.destroy();
      })
      this.loadedComponents = [];
    }
  }

  getComponentType(key: string): Type<any> | undefined {
    return WidgetMap.get(key);
  }
}
