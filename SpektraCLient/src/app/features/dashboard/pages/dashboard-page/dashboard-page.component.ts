import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideActivity,
  LucideArrowRight,
  LucideArrowUpRight,
  LucideBot,
  LucideClipboardCheck,
  LucideClock,
  LucideCircleCheckBig,
  LucideDynamicIcon,
  LucideFileSearch,
  LucideFolderGit2,
  LucideListTodo,
  LucidePlus,
  LucideRocket,
  LucideSend,
  LucideSparkles,
  LucideTerminal
} from '@lucide/angular';
import { AuthStoreService } from '@core/auth/auth-store.service';

interface KpiCard {
  label: string;
  value: string;
  delta: string;
  trendUp: boolean;
  icon: typeof LucideRocket.icon;
  spark: number[];
}

interface FeatureCard {
  title: string;
  description: string;
  route: string;
  icon: typeof LucideTerminal.icon;
}

interface RecentProject {
  name: string;
  generatedOn: string;
  status: 'Completed' | 'In Review' | 'In Progress';
}

interface AssistantMessage {
  role: 'assistant' | 'user';
  text: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    LucideDynamicIcon,
    LucideArrowRight,
    LucideArrowUpRight,
    LucideBot,
    LucidePlus,
    LucideSend,
    LucideSparkles
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly authStore = inject(AuthStoreService);

  readonly firstName = this.authStore.firstName;
  readonly isLoading = signal(true);

  readonly kpis: KpiCard[] = [
    {
      label: 'Requirements Shipped',
      value: '128',
      delta: '+12%',
      trendUp: true,
      icon: LucideRocket.icon,
      spark: [4, 6, 5, 8, 7, 9, 12, 11, 14, 13, 16]
    },
    {
      label: 'Logs Analyzed',
      value: '842',
      delta: '+8%',
      trendUp: true,
      icon: LucideActivity.icon,
      spark: [10, 12, 11, 13, 15, 14, 17, 19, 18, 21, 23]
    },
    {
      label: 'Test Cases Generated',
      value: '356',
      delta: '+21%',
      trendUp: true,
      icon: LucideCircleCheckBig.icon,
      spark: [6, 7, 9, 8, 11, 13, 12, 15, 17, 19, 22]
    },
    {
      label: 'Avg. Turnaround',
      value: '4.2m',
      delta: '-18%',
      trendUp: true,
      icon: LucideClock.icon,
      spark: [22, 20, 21, 18, 17, 15, 14, 13, 11, 10, 9]
    }
  ];

  readonly featureCards: FeatureCard[] = [
    {
      title: 'Requirement to Code',
      description: 'Convert requirement into Angular code, APIs, tests and more',
      route: '/requirement-to-code',
      icon: LucideTerminal.icon
    },
    {
      title: 'Log Analyzer',
      description: 'Upload error logs and get AI-powered root cause analysis',
      route: '/log-analyzer',
      icon: LucideFileSearch.icon
    },
    {
      title: 'Test Case Generator',
      description: 'Generate test cases from requirements',
      route: '/test-case-generator',
      icon: LucideClipboardCheck.icon
    },
    {
      title: 'Jira Task Generator',
      description: 'Create Jira tasks automatically from requirements',
      route: '/jira-generator',
      icon: LucideListTodo.icon
    }
  ];

  readonly folderIcon = LucideFolderGit2.icon;

  readonly recentProjects: RecentProject[] = [
    { name: 'Employee Onboarding Module', generatedOn: '25 May 2024, 10:30 AM', status: 'Completed' },
    { name: 'Invoice Reconciliation Service', generatedOn: '22 May 2024, 4:05 PM', status: 'In Progress' },
    { name: 'Customer Feedback Analyzer', generatedOn: '19 May 2024, 9:15 AM', status: 'In Review' }
  ];

  readonly suggestedPrompts = [
    'Summarize last week’s requirements',
    'Find flaky tests in the last run',
    'Draft a Jira epic for onboarding'
  ];

  readonly assistantInput = signal('');
  readonly assistantMessages = signal<AssistantMessage[]>([
    {
      role: 'assistant',
      text: 'Hi! Ask me about your requirements, logs, or tasks and I’ll point you to the right workspace.'
    }
  ]);

  constructor() {
    setTimeout(() => this.isLoading.set(false), 650);
  }

  statusChipClass(status: RecentProject['status']): string {
    switch (status) {
      case 'Completed':
        return 'chip-green';
      case 'In Review':
        return 'chip-yellow';
      default:
        return 'chip-blue';
    }
  }

  sparklinePoints(data: number[]): string {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = 100 / (data.length - 1);

    return data
      .map((value, index) => {
        const x = index * step;
        const y = 30 - ((value - min) / range) * 28;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  useSuggestedPrompt(prompt: string): void {
    this.assistantInput.set(prompt);
  }

  sendAssistantMessage(): void {
    const text = this.assistantInput().trim();
    if (!text) {
      return;
    }

    this.assistantMessages.update((messages) => [...messages, { role: 'user', text }]);
    this.assistantInput.set('');

    setTimeout(() => {
      this.assistantMessages.update((messages) => [
        ...messages,
        {
          role: 'assistant',
          text: 'Full Copilot chat is coming soon. In the meantime, try the Requirement to Code workspace for AI-assisted generation.'
        }
      ]);
    }, 500);
  }
}
