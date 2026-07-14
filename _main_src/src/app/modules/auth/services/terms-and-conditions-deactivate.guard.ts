import { ActivatedRouteSnapshot, CanDeactivate, CanDeactivateFn, GuardResult, MaybeAsync, RouterStateSnapshot } from '@angular/router';
import { TermsAndConditionsComponent } from '../../home/terms-and-conditions/terms-and-conditions.component';
import { Injectable } from '@angular/core';
import { TermsAndConditionsService } from 'src/app/services/terms-and-conditions.service';

@Injectable({ providedIn: 'root' })
export class TermsAndConditionsDeactivateGuard implements CanDeactivate<TermsAndConditionsComponent>{

  constructor(private termsAndConditionsService:TermsAndConditionsService){


  }

  canDeactivate(component:TermsAndConditionsComponent, 
                currentRoute: ActivatedRouteSnapshot, 
                currentState: RouterStateSnapshot, 
                nextState: RouterStateSnapshot): MaybeAsync<GuardResult> {
    return this.termsAndConditionsService.IsAcceptedTermsAndConditions;
  }




  
}
