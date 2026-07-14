import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionTimeoutService } from 'src/app/services/session-timeout.service';

@Injectable()
export class SessionTimeoutInterceptor implements HttpInterceptor {
  constructor(private _sessionTimeoutService: SessionTimeoutService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this._sessionTimeoutService.setLastActivityTime(); // Reset session timeout on HTTP request
    return next.handle(req);
  }
}
