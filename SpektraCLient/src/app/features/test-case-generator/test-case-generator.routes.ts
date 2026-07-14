import { Routes } from '@angular/router';
import { TestCaseGeneratorPageComponent } from './pages/test-case-generator-page/test-case-generator-page.component';

export const testCaseGeneratorRoutes: Routes = [
  {
    path: '',
    component: TestCaseGeneratorPageComponent,
    title: 'Test Case Generator'
  }
];
