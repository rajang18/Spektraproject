import { Injectable } from '@angular/core'; 
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { AppSettingsService } from './app-settings.service';
import { AuthService } from '../shared/models/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {

  private get SESSION_TIMEOUT(){
    if(this.appSettingsService.$rootScope.PortalSessionTimeOut == null)
      return 15 * 60 * 1000; // 15 minutes in milliseconds
    else
      return this.appSettingsService.$rootScope.PortalSessionTimeOut * 60 * 1000;
  } 

  private get WARNING_TIMEOUT(){
    if(this.appSettingsService.$rootScope.PortalSessionTimeOutWarning == null)
      return 14 * 60 * 1000; // 15 minutes in milliseconds
    else
      return this.appSettingsService.$rootScope.PortalSessionTimeOutWarning * 60 * 1000;
  }  

  private timer$ = timer(0, 1000); // Emit a value every second
  private lastActivityTime = Date.now();
  private expiration$ = new BehaviorSubject<boolean>(false);
  private warning$ = new BehaviorSubject<number>(-1);
  constructor(
    private authService: AuthService,
    private appSettingsService:AppSettingsService
  ) {
    this.initSessionTimeout();
    this.setupActivityDetection();  
  }

  private initSessionTimeout(): void {
    this.timer$?.subscribe(() => {
      if (this.authService.instance.getActiveAccount()) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.lastActivityTime;
        if (elapsedTime >= this.SESSION_TIMEOUT) {
          this.expiration$.next(true);
        } 
        //else if (elapsedTime >= this.SESSION_TIMEOUT - this.WARNING_TIMEOUT) {
        else if (elapsedTime >= this.WARNING_TIMEOUT) {
          this.warning$.next(Math.ceil((this.SESSION_TIMEOUT - elapsedTime) / 1000));
        }
      }
    });
  }

  private setupActivityDetection(): void {
    window.addEventListener('mousemove', () => this.setLastActivityTime());
    window.addEventListener('keypress', () => this.setLastActivityTime());
    window.addEventListener('scroll', () => this.setLastActivityTime());
    window.addEventListener('click', () => this.setLastActivityTime());
  }

  public setLastActivityTime(): void {
    this.lastActivityTime = Date.now();
    this.resetSessionTimeout()
  }

  public getSessionExpiration(): Observable<boolean> {
    return this.expiration$.asObservable();
  }

  public getSessionWarning(): Observable<number> {
    return this.warning$.asObservable();
  }

  public resetSessionTimeout(): void {
    this.expiration$.next(false);
  }

  public resetSession(): void {
    this.lastActivityTime = Date.now();
    this.expiration$.next(false);
  }
}
