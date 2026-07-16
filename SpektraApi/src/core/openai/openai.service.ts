import { env } from '../../config/environment.js';
import { logger } from '../../config/logger.js';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import {
  AnalyzeLogsRequest,
  AnalyzeLogsResponse,
  GenerateJiraTasksRequest,
  GenerateJiraTasksResponse,
  GenerateTestCasesRequest,
  GenerateTestCasesResponse,
  RequirementArtifactsRequest,
  RequirementArtifactsResponse
} from './copilot-ai.types.js';
import {
  jiraTasksJsonSchema,
  logAnalysisJsonSchema,
  requirementArtifactsJsonSchema,
  testCasesJsonSchema
} from './copilot-ai.schemas.js';
import { openaiClient } from './openai.client.js';
import { OpenAiResponseFormatError, OpenAiServiceError } from './openai-error.js';
import { buildDynamicC3Context } from './c3-context-retriever.js';
import { buildC3CodeCheckPrecheck } from './c3-codecheck-precheck.js';
import { withProjectContext } from './project-knowledge.js';
import { withRetry } from './retry-policy.js';

interface GenerateJsonOptions<TResponse> {
  operationName: string;
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
  temperature?: number;
  fallbackParser?: (content: string) => TResponse;
}

interface GenerateTextOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export class OpenAiService {
  private buildAugmentedUserPrompt(userPrompt: string): string {
    const dynamicContext = buildDynamicC3Context(userPrompt);
    return `${userPrompt}\n\n${dynamicContext}`;
  }

  async generateRequirementArtifacts(request: RequirementArtifactsRequest): Promise<RequirementArtifactsResponse> {
    this.ensureConfigured();

    const hasClarificationAnswers = !!request.clarificationAnswers?.length;
    const precheckContext = buildC3CodeCheckPrecheck(request.requirement);

    const clarificationRule = hasClarificationAnswers
      ? 'The user has ALREADY answered clarification questions (provided below). You MUST NOT ask for clarification again: set isClarificationNeeded=false and return empty clarificationQuestions and missingInputs arrays. Use the requirement plus the answers to produce complete, final artifacts now.'
      : 'Only if the requirement is genuinely ambiguous and cannot be implemented, set isClarificationNeeded=true and return clarificationQuestions (max 3) and missingInputs, with empty files/implementationNotes/risks and a short summary of what is needed. Prefer making reasonable senior-engineer assumptions and generating artifacts over asking questions.';

    const response = await this.generateJson<RequirementArtifactsResponse>({
      operationName: 'generateRequirementArtifacts',
      systemPrompt: withProjectContext(
        `You are a senior software architect. Return production-ready requirement implementation artifacts as strict JSON. Always return all of these top-level fields: summary, files, implementationNotes, risks, isClarificationNeeded, clarificationQuestions, missingInputs. When you generate artifacts, set isClarificationNeeded=false and return empty clarificationQuestions and missingInputs. The dynamic project-context snippets are only partial retrieval hints; never treat them as the complete codebase or refuse to answer because of them. ${clarificationRule}`
      ),
      userPrompt: [
        `Target framework: ${request.targetFramework ?? 'Angular 18 and Node.js'}`,
        request.codingStandards ? `Coding standards: ${request.codingStandards}` : undefined,
        precheckContext ? `Deterministic codebase precheck:\n${precheckContext}` : undefined,
        request.clarificationAnswers?.length
          ? `Clarification answers:\n${request.clarificationAnswers.map((answer, index) => `${index + 1}. ${answer}`).join('\n')}`
          : undefined,
        `Requirement:\n${request.requirement}`
      ]
        .filter(Boolean)
        .join('\n\n'),
      schemaName: 'requirement_artifacts',
      schema: requirementArtifactsJsonSchema as unknown as Record<string, unknown>,
      temperature: 0.2
    });

    // Hard guard: once the user has answered clarifications, never loop back into
    // clarification mode regardless of what the model returns.
    if (hasClarificationAnswers) {
      return {
        ...response,
        isClarificationNeeded: false,
        clarificationQuestions: [],
        missingInputs: []
      };
    }

    return response;
  }

  async analyzeLogs(request: AnalyzeLogsRequest): Promise<AnalyzeLogsResponse> {
    this.ensureConfigured();

    return this.generateJson<AnalyzeLogsResponse>({
      operationName: 'analyzeLogs',
      systemPrompt: withProjectContext(
        [
          'You are an enterprise SRE analyzing application logs. Return a structured incident analysis as strict JSON with these parts:',
          '(1) logBreakdown: one row per distinct meaningful log line (each ERROR/WARN/INFO entry that matters) — the exact logLine text, a one-sentence plain-English meaning, and the likelyCause.',
          '(2) executionFlow: an ordered list of short phrases (3-8 words each) describing the causal chain from the first action to the final failure, in the order it happened. This is rendered as a vertical step diagram, so keep each entry terse and self-contained.',
          '(3) thingsToCheck: 3-6 concrete verification/remediation items. Each has a title, a steps array of plain-English sub-actions (empty array if not needed), and codeSnippet + codeLanguage (e.g. "typescript") when a code check or fix is the clearest way to show it — use empty strings for codeSnippet/codeLanguage when no code is needed.',
          '(4) rootCause: evidence (the exact log line or phrase that is the strongest proof of the root cause), explanation (why that is the root cause), and consequences (bullet list of what followed as a result of it).',
          '(5) recommendations: concise one-line actionable items for a quick-glance summary (in addition to the detail in thingsToCheck).',
          '(6) signals: pattern/evidence pairs for other notable log patterns detected.',
          'In every string field: wrap shell commands, CLI flags, file paths, environment variables, class/property names, or code tokens in backticks (e.g. `npm install`, `idToken`, `/etc/app/config.yaml`); use **double asterisks** around critical terms and error names.'
        ].join(' ')
      ),
      userPrompt: [request.environment ? `Environment: ${request.environment}` : undefined, `Logs:\n${request.logContent}`]
        .filter(Boolean)
        .join('\n\n'),
      schemaName: 'log_analysis',
      schema: logAnalysisJsonSchema as unknown as Record<string, unknown>,
      temperature: 0.1
    });
  }

  async generateTestCases(request: GenerateTestCasesRequest): Promise<GenerateTestCasesResponse> {
    this.ensureConfigured();

    return this.generateJson<GenerateTestCasesResponse>({
      operationName: 'generateTestCases',
      systemPrompt: withProjectContext(
        'You are a senior QA architect. Generate test cases with clear steps, preconditions, priorities, and expected results as strict JSON.'
      ),
      userPrompt: `Test level: ${request.testLevel ?? 'unit'}\n\nRequirement:\n${request.requirement}`,
      schemaName: 'test_cases',
      schema: testCasesJsonSchema as unknown as Record<string, unknown>,
      temperature: 0.2
    });
  }

  async generateJiraTasks(request: GenerateJiraTasksRequest): Promise<GenerateJiraTasksResponse> {
    this.ensureConfigured();

    return this.generateJson<GenerateJiraTasksResponse>({
      operationName: 'generateJiraTasks',
      systemPrompt: withProjectContext(
        'You are an agile product owner. Generate Jira-ready tasks with estimates, labels, and acceptance criteria as strict JSON.'
      ),
      userPrompt: [
        request.projectKey ? `Project key: ${request.projectKey}` : undefined,
        `Include acceptance criteria: ${request.includeAcceptanceCriteria ?? true}`,
        `Requirement:\n${request.requirement}`
      ]
        .filter(Boolean)
        .join('\n\n'),
      schemaName: 'jira_tasks',
      schema: jiraTasksJsonSchema as unknown as Record<string, unknown>,
      temperature: 0.2
    });
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    this.ensureConfigured();
    const augmentedUserPrompt = this.buildAugmentedUserPrompt(options.userPrompt);

    const response = await withRetry(
      () =>
        openaiClient.chat.completions.create({
          model: env.OPENAI_MODEL,
          messages: [
            { role: 'system', content: withProjectContext(options.systemPrompt) },
            { role: 'user', content: augmentedUserPrompt }
          ],
          temperature: options.temperature ?? 0.2
        }),
      {
        attempts: env.OPENAI_MAX_RETRIES,
        baseDelayMs: env.OPENAI_RETRY_BASE_DELAY_MS,
        maxDelayMs: env.OPENAI_RETRY_MAX_DELAY_MS,
        operationName: 'generateText'
      }
    );

    return response.choices[0]?.message?.content ?? '';
  }

  private async generateJson<TResponse>(options: GenerateJsonOptions<TResponse>): Promise<TResponse> {
    try {
      const augmentedUserPrompt = this.buildAugmentedUserPrompt(options.userPrompt);
      const response = await withRetry(
        () =>
          openaiClient.chat.completions.create({
            model: env.OPENAI_MODEL,
            messages: [
              { role: 'system', content: options.systemPrompt },
              { role: 'user', content: augmentedUserPrompt }
            ],
            temperature: options.temperature ?? 0.2,
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: options.schemaName,
                strict: true,
                schema: options.schema
              }
            }
          } as Parameters<typeof openaiClient.chat.completions.create>[0]),
        {
          attempts: env.OPENAI_MAX_RETRIES,
          baseDelayMs: env.OPENAI_RETRY_BASE_DELAY_MS,
          maxDelayMs: env.OPENAI_RETRY_MAX_DELAY_MS,
          operationName: options.operationName
        }
      );

      const completion = response as ChatCompletion;
      const content = completion.choices[0]?.message?.content ?? '';
      return this.parseStructuredOutput<TResponse>(content, options);
    } catch (error) {
      if (error instanceof OpenAiResponseFormatError) {
        throw error;
      }

      logger.error({ error, operationName: options.operationName }, 'OpenAI operation failed');
      throw new OpenAiServiceError('AI generation failed. Please retry the request.', {
        operationName: options.operationName
      });
    }
  }

  private parseStructuredOutput<TResponse>(content: string, options: GenerateJsonOptions<TResponse>): TResponse {
    try {
      return JSON.parse(content) as TResponse;
    } catch (error) {
      if (options.fallbackParser) {
        return options.fallbackParser(content);
      }

      throw new OpenAiResponseFormatError('AI response did not match the expected JSON format.', {
        operationName: options.operationName,
        error
      });
    }
  }

  private ensureConfigured(): void {
    if (!env.OPENAI_API_KEY) {
      throw new OpenAiServiceError('OpenAI API key is not configured. Set OPENAI_API_KEY before using AI endpoints.', {
        operationName: 'openaiConfiguration'
      });
    }
  }
}

export const openAiService = new OpenAiService();
