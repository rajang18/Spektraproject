import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-redirect',
  standalone: true,
  imports: [],
  templateUrl: './msal-redirect.component.html',
  styleUrl: './msal-redirect.component.scss'
})
export class MsalRedirectComponent implements OnInit {
  _subscription: Subscription;
  public _subscriptionArray: Subscription[] = []; 
  constructor(private _authService: MsalService) { }
  _destroy$ = new Subject<void>();


  ngOnInit(): void {    
     const subscription = this._authService.handleRedirectObservable().pipe(takeUntil(this._destroy$)).subscribe();
    this._subscriptionArray?.push(subscription);
  }

  ngOnDestroy(){
    this._destroy$.next();
    this._destroy$.complete();
    this._subscriptionArray?.forEach((sb) => sb?.unsubscribe());
    this._subscriptionArray = [];
  }
}
