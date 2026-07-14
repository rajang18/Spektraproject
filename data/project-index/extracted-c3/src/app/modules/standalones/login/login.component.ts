import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalModule, MsalService } from '@azure/msal-angular';
import { RedirectRequest } from '@azure/msal-browser';
import { AuthService } from 'src/app/shared/models/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MsalModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  
  constructor(@Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    router: Router,
    private authService: AuthService){
    let userInfo = this.authService.instance.getActiveAccount();
    if (userInfo?.idToken) {
        window.location.href = '/loggedin';
    }else{
      this.login();
    }
  }


  login() { 
    localStorage.removeItem("impersonationContext");
    localStorage.removeItem("resellerImpersonationContext");
    localStorage.removeItem("planContext");
    window.localStorage.clear();
    this.loginRedirect();
  }

  loginRedirect() {
    //sessionStorage.setItem("isLoginInprogress","true")
    if (this.msalGuardConfig.authRequest) {
        this.authService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
    } else {
        this.authService.loginRedirect();
    }
  }


}
