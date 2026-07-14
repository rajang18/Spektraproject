import { Directive, Input, ElementRef, Renderer2, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { fromEvent, debounceTime, switchMap } from 'rxjs';
import { LoaderService } from 'src/app/services/loader.service';

@Directive({
  selector: '[appBusyLoader]'
})
export class BusyLoaderDirective {
  @Input() isIconOnly :boolean= false; // Parameter
  @Input() isDisabledOnly :boolean= false; // Parameter

  private originalText: string = '';
  private loadingText: string = 'TRANSLATE.MESSAGE_TEXT_PLEASE_WAIT'; // Change this to whatever your loading text is
  isLoading: boolean = false;
  private debounceTime: number = 300; // Adjust debounce time as needed

  constructor(private el: ElementRef, private renderer: Renderer2,
    private loadingService  :LoaderService,
    private _translateService: TranslateService
  ) {
    this.loadingService.$commonLoadingSubject.subscribe((res:any)=>{
        if(this.isLoading==res){
            return
        }
        this.isLoading = res;
        if (res) {
            this.showLoadingState();
          } else {
            this.hideLoadingState();
          }
      });

      // Set up debounce on click
    fromEvent(this.el.nativeElement, 'click').pipe(
        debounceTime(this.debounceTime),
        switchMap(() => {
          if (this.isLoading) {
            return []; // Ignore if already loading
          }
          return new EventEmitter(); // You can customize this to emit events if needed
        })
      ).subscribe();
  }

  private showLoadingState() {
    // Disable the button
    this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
    setTimeout(() => {
    // Store the original text
    this.originalText = this.el.nativeElement.innerHTML;

    if(this.isDisabledOnly){
      return;
    }
    // Create loading spinner
    
    const spinner = this.renderer.createElement('span');
    this.renderer.addClass(spinner, 'spinner-border');
    this.renderer.addClass(spinner, 'spinner-border-sm');
    this.renderer.setAttribute(spinner, 'role', 'status');
    this.renderer.setAttribute(spinner, 'aria-hidden', 'true');

    // Clear the button content and append the spinner and loading text
    if(this.originalText) {
      this.renderer.setProperty(this.el.nativeElement, 'innerHTML', '');
      this.renderer.appendChild(this.el.nativeElement, spinner);
      if(!this.isIconOnly){
        this.renderer.appendChild(this.el.nativeElement, document.createTextNode(' '+this._translateService.instant(this.loadingText)));
      }
    }
    }, 10);
  }

  private hideLoadingState() {
    setTimeout(() => {
      // Restore the original button text
      if(this.originalText) {
        // Clear the button content and append the spinner and loading text
        this.renderer.setProperty(this.el.nativeElement, 'innerHTML', this.originalText);
      }
      // Re-enable the button
      if(!this.isLoading){
      this.renderer.setProperty(this.el.nativeElement, 'disabled', false);
      }
    },10)
  }
}
