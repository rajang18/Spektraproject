export type ArtifactView = 'overview' | 'form' | 'api' | 'jira' | 'tests' | 'code';

export interface GeneratedField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'file' | 'select';
  icon: string;
  placeholder: string;
  required: boolean;
  value: string;
  options?: string[];
}

export interface ApiEndpoint {
  id: string;
  method: string;
  path: string;
  title: string;
  bodyLabel: string;
  body: Record<string, unknown>;
}

export interface JiraTask {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Done';
}

export interface TestCase {
  id: string;
  description: string;
  expectedResult: string;
}

export interface CodeFile {
  id: string;
  path: string;
  content: string;
}

export interface GeneratedModuleMock {
  title: string;
  generatedAt: string;
  status: string;
  loaderProgress: number;
  requirement: string;
  tabs: Array<{ id: ArtifactView; label: string }>;
  fields: GeneratedField[];
  endpoints: ApiEndpoint[];
  jiraTasks: JiraTask[];
  testCases: TestCase[];
  codeFiles: CodeFile[];
}

export const generatedModuleMock: GeneratedModuleMock = {
  title: 'Employee Onboarding Module',
  generatedAt: '25 May 2024 10:30 AM',
  status: 'Generated Successfully',
  loaderProgress: 72,
  requirement: `Build Employee Onboarding Module

Fields:
- Name
- Email
- Mobile
- PAN Card
- Aadhaar Upload
- Department Dropdown

Features:
- Email Verification
- Admin Approval
- Export to Excel`,
  tabs: [
    { id: 'overview', label: 'Overview' },
    { id: 'form', label: 'Form Preview' },
    { id: 'api', label: 'API Contract' },
    { id: 'jira', label: 'Jira Tasks' },
    { id: 'tests', label: 'Test Cases' },
    { id: 'code', label: 'Code Preview' }
  ] satisfies Array<{ id: ArtifactView; label: string }>,
  fields: [
    { key: 'name', label: 'Name', type: 'text', icon: 'Aa', placeholder: 'Enter name', required: true, value: '' },
    { key: 'email', label: 'Email', type: 'email', icon: 'Aa', placeholder: 'Enter email', required: true, value: '' },
    { key: 'mobile', label: 'Mobile', type: 'tel', icon: '1a', placeholder: 'Enter mobile number', required: true, value: '' },
    { key: 'panCard', label: 'PAN Card', type: 'text', icon: '1a', placeholder: 'Enter PAN card number', required: true, value: '' },
    { key: 'aadhaarUpload', label: 'Aadhaar Upload', type: 'file', icon: 'Aa', placeholder: 'Choose Aadhaar file', required: true, value: '' },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      icon: '[]',
      placeholder: 'Select department',
      required: true,
      value: 'Engineering',
      options: ['Engineering', 'Finance', 'Human Resources', 'Operations']
    }
  ] satisfies GeneratedField[],
  endpoints: [
    {
      id: 'create',
      method: 'POST',
      path: '/api/employees',
      title: 'Create Employee',
      bodyLabel: 'Request Body',
      body: {
        name: 'string',
        email: 'string',
        mobile: 'string',
        panCard: 'string',
        aadhaarUpload: 'string',
        departmentId: 'number'
      }
    },
    {
      id: 'get',
      method: 'GET',
      path: '/api/employees/{id}',
      title: 'Get Employee By ID',
      bodyLabel: 'Response',
      body: {
        id: 'number',
        name: 'string',
        email: 'string',
        status: 'PendingApproval'
      }
    },
    {
      id: 'update',
      method: 'PUT',
      path: '/api/employees/{id}',
      title: 'Update Employee',
      bodyLabel: 'Request Body',
      body: {
        email: 'string',
        mobile: 'string',
        departmentId: 'number'
      }
    },
    {
      id: 'departments',
      method: 'GET',
      path: '/api/departments',
      title: 'Get Departments',
      bodyLabel: 'Response',
      body: {
        departments: 'Department[]'
      }
    }
  ] satisfies ApiEndpoint[],
  jiraTasks: [
    { id: 'EMP-101', title: 'Create onboarding UI', priority: 'High', status: 'To Do' },
    { id: 'EMP-102', title: 'Implement backend API', priority: 'High', status: 'To Do' },
    { id: 'EMP-103', title: 'Add form validations', priority: 'Medium', status: 'To Do' },
    { id: 'EMP-104', title: 'Implement email verification', priority: 'Medium', status: 'To Do' },
    { id: 'EMP-105', title: 'Add admin approval workflow', priority: 'Medium', status: 'To Do' },
    { id: 'EMP-106', title: 'Export to Excel functionality', priority: 'Low', status: 'To Do' }
  ] satisfies JiraTask[],
  testCases: [
    { id: 'TC-001', description: 'Name field is required', expectedResult: 'Validation message should be shown' },
    { id: 'TC-002', description: 'Email format validation', expectedResult: 'Invalid email should be rejected' },
    { id: 'TC-003', description: 'Mobile number validation', expectedResult: 'Only numbers should be allowed' },
    { id: 'TC-004', description: 'PAN card validation', expectedResult: 'Invalid PAN should be rejected' },
    { id: 'TC-005', description: 'Aadhaar upload validation', expectedResult: 'Only PDF/JPG files allowed' },
    { id: 'TC-006', description: 'Admin approval workflow', expectedResult: 'Employee status should be pending' },
    { id: 'TC-007', description: 'Export to Excel', expectedResult: 'Data should be exported successfully' }
  ] satisfies TestCase[],
  codeFiles: [
    {
      id: 'module',
      path: 'employee-onboarding.module.ts',
      content: `@NgModule({
  imports: [CommonModule, ReactiveFormsModule],
  declarations: [EmployeeOnboardingComponent]
})
export class EmployeeOnboardingModule {}`
    },
    {
      id: 'component',
      path: 'employee-onboarding.component.ts',
      content: `this.form = this.fb.group({
  name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  mobile: ['', Validators.required],
  panCard: ['', Validators.required],
  aadhaar: ['', Validators.required],
  departmentId: ['', Validators.required]
});

onSubmit() {
  if (this.form.valid) {
    this.employeeService.create(this.form.value)
      .subscribe(res => console.log(res));
  }
}`
    },
    {
      id: 'html',
      path: 'employee-onboarding.component.html',
      content: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <input formControlName="name" placeholder="Enter name" />
  <input formControlName="email" placeholder="Enter email" />
  <button type="submit">Submit</button>
</form>`
    },
    {
      id: 'service',
      path: 'employee-onboarding.service.ts',
      content: `create(payload: EmployeeCreateRequest) {
  return this.http.post<Employee>('/api/employees', payload);
}`
    }
  ] satisfies CodeFile[]
};
