import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WelcomeRoutingModule } from './welcome-routing.module';
import { WelcomeComponent } from './welcome.component';
import {MsalModule
  
} from '@azure/msal-angular';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationModule } from '../i18n';
import { BaseWelcomeComponent } from './base-welcome.component';


@NgModule({
  declarations: [WelcomeComponent, BaseWelcomeComponent],
  imports: [
    CommonModule,
    WelcomeRoutingModule,
    MsalModule,
    TranslationModule,
    TranslateModule
  ],
  providers:[ 
  ]
})
export class WelcomeModule { }
