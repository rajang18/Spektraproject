import { Injectable, OnDestroy } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesService {
  private destroy$ = new Subject<void>();
  private _unsavedChanges = false;
  
  constructor(private _router: Router) { 
    // Subscribe to router events
    this._router.events
    .pipe(takeUntil(this.destroy$))
    .subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this._unsavedChanges) {
          const confirmed = confirm('You have unsaved changes. Are you sure you want to leave this page?');
          if (!confirmed) {
            this._router.navigateByUrl(this._router.url); 
          }
        }
      }
    });
  }

  setUnsavedChanges(value: boolean) {
    this._unsavedChanges = value;
  }

  getUnsavedChanges() {
    return this._unsavedChanges;
  }

  confirmNavigation(): boolean {
    if (this._unsavedChanges) {
      return confirm('You have unsaved changes. Are you sure you want to leave this page?');
    }
    return true;
  } 

}
