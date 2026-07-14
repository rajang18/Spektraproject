import { ComponentFactoryResolver, Directive, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { WidgetLoaderService } from './widget-loader.service';
@Directive({
  selector: '[appWidgetLoader]'
})
export class WidgetLoaderDirective implements OnInit {
  @Input('appWidgetLoader') key!: string;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private widgetLoaderService: WidgetLoaderService,
    private cfr: ComponentFactoryResolver

  ) { }

  ngOnInit(): void {
    const componentType = this.widgetLoaderService.getComponentType(this.key);
    if (componentType) {
      this.widgetLoaderService.loadComponent(this.viewContainerRef, componentType, this.key); 
    }
  }
}
