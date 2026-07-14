import { ComponentFactoryResolver,Injectable} from '@angular/core';
import { IndividualConfig, ToastRef, ToastrService } from 'ngx-toastr';
import { NotificationTemplateComponent } from '../modules/standalones/notification-template/notification-template.component';
import { customTemplateTypes } from '../modules/standalones/notification-template/notification-template-utilities';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  viewContainerRef: any;
  renderer: any;
  cdref: any;
  arrayOfTemplatesTypes = customTemplateTypes;
  translateService: any;
  private __defaultOptions: Partial<IndividualConfig<any>> = {
    closeButton: true, // Set closeButton to true globally
    timeOut: 0, // Set timeout to 0 to prevent auto-close
    positionClass: 'toast-bottom-right', // Set the position of the toasts
    extendedTimeOut: 0,
    toastClass: 'full-width-toast ngx-toastr', // Custom class for full width
    tapToDismiss: false,
    enableHtml: true
    
  };
  constructor(
    private _toastr: ToastrService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private sanitizer: DomSanitizer
  ) {

  }

  /**
   * 
   * @param message 
   * @param options 
   */
  success(message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOption = { ...this.__defaultOptions, ...options }
    this._toastr.success(message, '', toastOption);
  }

  /**
   * 
   * @param message 
   * @param options 
   */
  error(message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOption = { ...this.__defaultOptions, ...options }
    this._toastr.error(message, '', toastOption);
  }

  /**
   * 
   * @param message 
   * @param options 
   */
  warning(message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOption = { ...this.__defaultOptions, ...options }
    this._toastr.warning(message, '', toastOption);
  }

  /**
   * 
   * @param message 
   * @param options 
   */
  info(message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOption = { ...this.__defaultOptions, ...options }
    this._toastr.info(message, '', toastOption);
  }


  show(type: 'All good' | 'Attention' | 'Warning' | 'Info', message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOptions = { ...this.__defaultOptions, ...options };

    switch (type) {
      case 'All good':
        this._toastr.success(message, '', toastOptions);
        break;
      case 'Attention':
        this._toastr.error(message, '', toastOptions);
        break;
      case 'Warning':
        this._toastr.warning(message, '', toastOptions);
        break;
      case 'Info':
        this._toastr.info(message, '', toastOptions);
        break;
      default:
    }
  }


  /**
  * 
  * @param message 
  * @param options 
  */
  clear(): void {
    this._toastr.clear();
  }
  
  showWithTemplate(templateName: string, data?: any, options?: Partial<IndividualConfig<any>>): void {
    templateName = templateName.replace(/\s+/g, '-');
    
    // Determine the component to use based on the template name.
    const component = templateName;

    // Find the matched template object from the array.
    const matchedObject = this.arrayOfTemplatesTypes.find(obj => obj.type === templateName);

    // Create the component reference.
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(NotificationTemplateComponent);
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(componentFactory); 

    // Set up the component instance with the provided data or defaults.
    const instance = componentRef.instance;
    instance.title = data?.title || this.translateService.instant(matchedObject?.title);
    instance.description = data?.description || this.translateService.instant(matchedObject?.description);
    instance.buttonDetails = {
      btnColor: data?.btnColor || '', 
      btnText: data?.btnText || '',    
      btnTextColor: data?.btnTextColor || '', 
      btnUrl: data?.btnUrl || ''        
    };
    instance.templateName = component;
    componentRef.changeDetectorRef.detectChanges(); 

    // Extract HTML from the component.
    const container = this.renderer.createElement('div');
    document.documentElement.style.setProperty( '--notification-bg-color', data?.btnColor||  matchedObject.defaultBtnColor);
    document.documentElement.style.setProperty( '--notification-text', data?.btnTextColor || '');
    this.renderer.appendChild(document.body, container);
    const componentHostElement = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    this.renderer.appendChild(container, componentHostElement); 
    const html = container.innerHTML; 

    // Remove the temporary container.
    this.renderer.removeChild(document.body, container);

    // Show the HTML content in a toast notification.
    const toastOptions: Partial<IndividualConfig<any>> = {
      ...this.__defaultOptions,
      ...options,
      toastClass: templateName ? `ngx-toastr full-width-toast ${templateName}` : 'toast'
    };

    this._toastr.show(html, '', toastOptions); 
  }


}
