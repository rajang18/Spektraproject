import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExternalProviderService {
  apiUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  authExternalProvider(provider: string) {
    localStorage.removeItem("impersonationContext");
    localStorage.removeItem("resellerImpersonationContext");
    localStorage.removeItem("planContext");
    localStorage.clear();

    // const serviceBase = 'https://49f3-150-107-25-197.ngrok-free.app/';
    const serviceBase = environment.apiBaseUrl;

    const redirectUri = location.protocol + '//' + location.host + '/authcomplete.html';
    localStorage.setItem("ExternalProvider",provider);
  //  const externalProviderUrl = `${serviceBase}api/login/ExternalLogin?provider=${provider}&response_type=token&client_id=ngAuthApp&redirect_uri=${redirectUri}`;
      const externalProviderUrl = `${serviceBase}/login/ExternalLogin?provider=${provider}&response_type=token&client_id=ngAuthApp&redirect_uri=${redirectUri}`;
    window.open(externalProviderUrl, "Authenticate Account", "location=0,status=0,width=600,height=750");
  }

  authCompletedCB(fragment: {
  provider: string,
  external_access_token: string,
  user_email: string
  external_user_name: string
}) {
  const externalData = {
    provider: fragment.provider,
    externalAccessToken: fragment.external_access_token,
    userEmail: fragment.user_email,
    external_user_name: fragment.external_user_name
  };

  const completeUrl = `${this.apiUrl}/login/ObtainLocalAccessToken`;

  this.http.post<any>(completeUrl, externalData).subscribe({
    next: (response) => {
      console.log("Response from ObtainLocalAccessToken:", response);

      const authData = {
        token: response.access_token,
        userName: response.userName,
        refreshToken: response.refresh_token,
        provider: fragment.provider
      };

      localStorage.setItem("authorizationData", JSON.stringify(authData));

      // Redirect after login
      window.location.href = `${window.location.protocol}//${window.location.host}/loggedin`;
    },
    error: (err) => {
      console.error("Token exchange failed:", err);
      localStorage.clear();
      this.router.navigate(['/welcome']);
    }
  });
}
}
