import { Routes } from '@angular/router';
import { HistoryPageComponent } from './pages/history-page/history-page.component';

export const historyRoutes: Routes = [
  {
    path: '',
    component: HistoryPageComponent,
    title: 'History'
  }
];
