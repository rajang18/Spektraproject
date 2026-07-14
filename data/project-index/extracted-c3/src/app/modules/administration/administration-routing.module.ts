import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomNotificationsComponent } from './custom-notifications/custom-notifications.component'; 
import { WebhookNotificationsComponent } from './webhook-notifications/webhook-notifications.component';
import { AdministrationComponent } from './administration/administration.component';
import { CustomNotificationAddComponent } from './custom-notifications/custom-notification-add/custom-notification-add.component';
import { WebhookNotificationService } from './services/webhook-notification-service.service';

const routes: Routes = [
  {
    path: '',
    component: AdministrationComponent,
    children: [
      { path: 'customNotifications', component: CustomNotificationsComponent },
      { path: 'webhookNotifications', component: WebhookNotificationsComponent },
      { path: 'customNotifications/add', component: CustomNotificationAddComponent },
      { path: 'engage', component: CustomNotificationsComponent },
      { path: '', redirectTo: '', pathMatch: 'full' } // Placeholder, will be replaced dynamically
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministrationRoutingModule { 
  constructor(private webhookService: WebhookNotificationService) {
    const defaultRoute = this.webhookService.getDefaultRoute();
    routes[0].children[4].redirectTo = defaultRoute;
  }
}
