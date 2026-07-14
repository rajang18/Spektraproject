import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { ClientSettingsResponse } from 'src/app/shared/models/appsettings.model';
import { UserSettingData } from 'src/app/modules/home/dashboard-widgets/models/dashboard.model';

// const BODY_CLASSES = ['bgi-size-cover', 'bgi-position-center', 'bgi-no-repeat'];

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit, OnDestroy {
  today: Date = new Date();
 userSettingsData:UserSettingData;
 private _subscription: Subscription;
  constructor(private _clientSettingsService: ClientSettingsService, private router: Router) { }


  ngOnInit(): void {
    this._subscription = this._clientSettingsService.getData().subscribe((data:Partial<ClientSettingsResponse>) => {
      this.userSettingsData = data.Data as UserSettingData
    });
  }

  ngOnDestroy() {
    this._subscription?.unsubscribe()
  }
}
