import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core'; 
import { C3CommonModule } from 'src/app/shared/c3-common-module/c3-common-module.module';

@Component({
  selector: 'app-notification-template',
  standalone: true,
  imports: [
    TranslateModule,
    CommonModule,
    C3CommonModule,
  ],
  templateUrl: './notification-template.component.html',
  styleUrl: './notification-template.component.scss'
})
export class NotificationTemplateComponent {
@Input() title?: string;
  @Input() description?: string;
  @Input() buttonDetails?: any
  @Input() templateName?:string;
  @Input() notificationType?:string;


}
