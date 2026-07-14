import { Injectable } from '@angular/core';
import { IndividualConfig, ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private __defaultOptions: Partial<IndividualConfig<any>> = {
    closeButton: true, // Set closeButton to true globally
    timeOut: 5000, // Set a default timeout of 2 seconds
    positionClass: 'toast-bottom-right',// Set the position of the toasts
    enableHtml: true 
  };
  constructor(private _toastr: ToastrService) { }

  /**
   * 
   * @param message 
   * @param options 
   */
  success(message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOption = {...this.__defaultOptions, ...options}
    this._toastr.success(message, '', toastOption);
  }

  /**
   * 
   * @param message 
   * @param options 
   */
  error(message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOption = {...this.__defaultOptions, ...options}
    this._toastr.error(message, '', toastOption);
  }

  /**
   * 
   * @param message 
   * @param options 
   */
  warning(message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOption = {...this.__defaultOptions, ...options}
    this._toastr.warning(message, '', toastOption);
  }

  /**
   * 
   * @param message 
   * @param options 
   */
  info(message: string, options?: Partial<IndividualConfig<any>>): void {
    const toastOption = {...this.__defaultOptions, ...options}
    this._toastr.info(message, '', toastOption);
  }

   /**
   * 
   * @param message 
   * @param options 
   */
   clear(): void {
    this._toastr?.clear();
  }
}
