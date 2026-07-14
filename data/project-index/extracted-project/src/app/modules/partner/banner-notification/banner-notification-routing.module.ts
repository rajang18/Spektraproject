import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BannerNotificationListComponent } from './components/banner-notification-list/banner-notification-list.component';
import { BannerNotificationAddComponent } from './components/banner-notification-add/banner-notification-add.component';

const routes: Routes = [
  {path:'', component:BannerNotificationListComponent},
  {path: 'add', component: BannerNotificationAddComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BannerNotificationRoutingModule { }
