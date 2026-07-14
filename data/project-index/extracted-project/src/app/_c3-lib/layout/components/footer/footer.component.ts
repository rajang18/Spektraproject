import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClientSettingsService } from 'src/app/services/client-settings.service';
import { ClientSettings, ClientSettingsResponse } from 'src/app/shared/models/appsettings.model';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit , OnDestroy {
  @Input() appFooterContainerCSSClass: string = '';
  private __unsubscribe: Subscription[] = [];
  userSettingsData:Partial<ClientSettings>
  subscription = Subscription
  currentDateStr: string = new Date().getFullYear().toString();
  constructor(private _clientSettingsService: ClientSettingsService) {}
  ngOnInit(): void {
    const susbs = this._clientSettingsService.getData().subscribe((data: Partial<ClientSettingsResponse>) => {
      // Ensure data.Data is correctly typed as ClientSettings or an array of ClientSettings
      
      if (Array.isArray(data.Data)) {

        // Handle the case where data.Data is an array (if needed)
        // For example, take the first element or handle appropriately
        this.userSettingsData = data.Data.length > 0 ? data.Data[0] : {}; // Example: take the first element
      } else {
        // Handle the case where data.Data is a single ClientSettings object
        this.userSettingsData = data.Data || {}; // Default to an empty object if data.Data is null or undefined
      }
    });
    this.__unsubscribe.push(susbs);
  }

  ngOnDestroy(): void {
    this.__unsubscribe.forEach((sb) => sb.unsubscribe());
  }
  
 
}
