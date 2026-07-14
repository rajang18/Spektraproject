import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]'
})
export class LazyLoadDirective {

  @Output() lazyLoad = new EventEmitter<void>();

  private observer: IntersectionObserver | undefined;
  private hasIntersected = false;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    const options = {
      root: null, // viewport
      threshold: 0.1 // trigger when 10% of the element is visible
    };

    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.hasIntersected) {
        this.hasIntersected = true;
        this.lazyLoad.emit();
        this.observer?.disconnect(); // disconnect once loaded
      }
    }, options);

    if (this.observer) {
      this.observer.observe(this.elementRef.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

}
