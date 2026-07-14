import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';
import { PermissionService } from 'src/app/services/permission.service';
import { ActionableElement } from '../models/constants/actionable-elements';

@Directive({
  selector: '[appPermission]',
  standalone: true,
})
export class PermissionDirective {

  @Input('appPermission') permissionKey: string;
  
  constructor(private el: ElementRef,
    private renderer:Renderer2,
    private permissionService:PermissionService) {}
 
  ngOnInit(){ 
    if(this.permissionKey){
      const actionableElement = new ActionableElement();
      let key = actionableElement.getConstantValue(this.permissionKey);
      if(key){
        let val = this.permissionService.hasPermission(key); 
        if(val != "Allowed"){
          this.renderer.setStyle(this.el.nativeElement,"display","none");
          this.el.nativeElement.style.setProperty('display', 'none', 'important');
        }
      }else{
        this.renderer.setStyle(this.el.nativeElement,"display","none");
        this.el.nativeElement.style.setProperty('display', 'none', 'important');
        console.log('Missing element in ActionableElement key:', this.permissionKey);
      }

    }
  } 

   
}
