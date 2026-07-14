import { Routes } from '@angular/router';
import { LogAnalyzerPageComponent } from './pages/log-analyzer-page/log-analyzer-page.component';

export const logAnalyzerRoutes: Routes = [
  {
    path: '',
    component: LogAnalyzerPageComponent,
    title: 'Log Analyzer'
  }
];
