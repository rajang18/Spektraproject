import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EngageListComponent } from './components/engage-list/engage-list.component';
import { EngageAddComponent } from './components/engage-add/engage-add.component';

const routes: Routes = [
  { path: '' ,component:EngageListComponent},
  { path: 'add',component: EngageAddComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EngageRoutingModule { }
