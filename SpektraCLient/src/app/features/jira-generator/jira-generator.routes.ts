import { Routes } from '@angular/router';
import { JiraGeneratorPageComponent } from './pages/jira-generator-page/jira-generator-page.component';

export const jiraGeneratorRoutes: Routes = [
  {
    path: '',
    component: JiraGeneratorPageComponent,
    title: 'Jira Generator'
  }
];
