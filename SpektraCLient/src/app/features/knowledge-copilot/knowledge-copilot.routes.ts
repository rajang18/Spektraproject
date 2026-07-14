import { Routes } from '@angular/router';
import { KnowledgeCopilotPageComponent } from './pages/knowledge-copilot-page/knowledge-copilot-page.component';

export const knowledgeCopilotRoutes: Routes = [
  {
    path: '',
    component: KnowledgeCopilotPageComponent,
    title: 'Knowledge Copilot'
  }
];
