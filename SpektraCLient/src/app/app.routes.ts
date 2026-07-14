import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './core/layout/shell/shell.component';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then((m) => m.LoginPageComponent),
    title: 'Sign in'
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes)
      },
      {
        path: 'requirement-to-code',
        loadChildren: () =>
          import('./features/requirement-to-code/requirement-to-code.routes').then(
            (m) => m.requirementToCodeRoutes
          )
      },
      {
        path: 'knowledge-copilot',
        loadChildren: () =>
          import('./features/knowledge-copilot/knowledge-copilot.routes').then(
            (m) => m.knowledgeCopilotRoutes
          )
      },
      {
        path: 'log-analyzer',
        loadChildren: () =>
          import('./features/log-analyzer/log-analyzer.routes').then((m) => m.logAnalyzerRoutes)
      },
      {
        path: 'jira-generator',
        loadChildren: () =>
          import('./features/jira-generator/jira-generator.routes').then((m) => m.jiraGeneratorRoutes)
      },
      {
        path: 'test-case-generator',
        loadChildren: () =>
          import('./features/test-case-generator/test-case-generator.routes').then(
            (m) => m.testCaseGeneratorRoutes
          )
      },
      {
        path: 'history',
        loadChildren: () => import('./features/history/history.routes').then((m) => m.historyRoutes)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.settingsRoutes)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
