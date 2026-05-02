/**
 * DataIQ — Analyst Team Orchestrator
 * Runs 4 specialized roles in sequence:
 *   Intake → Architect → Executor (per step) → Narrator
 * Yields SSE events throughout the entire pipeline.
 */

import OpenAI from 'openai';
import { ROLES } from './roles';
import { SandboxChecker } from './sandbox-checker';
import { runInSandbox } from '../sandbox';
import type { DataSourceSpec } from '../data-loader';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' });

// ─── SSE Event Types ────────────────────────────────────────────────────

export interface SSEEvent {
  event: string;
  data: any;
}

// ─── Orchestrator ───────────────────────────────────────────────────────

export class AnalystTeam {
  private checker = new SandboxChecker();

  /**
   * Main entry point — yields SSE events through the full pipeline.
   */
  async *run(
    prompt: string,
    schema: any[],
    dataSources: DataSourceSpec[],
    notebookContext?: Array<{ prompt: string; resultSummary?: string }>
  ): AsyncGenerator<SSEEvent> {

    // ── PHASE 1: INTAKE ───────────────────────────────────────────────
    yield { event: 'role_start', data: {
      role: 'intake', name: 'Intake Analyst', emoji: '🔍',
      message: 'Understanding your question...'
    }};

    const intakeResult = await this._runRole('intake', prompt, {
      schema,
      prompt,
      notebookContext: notebookContext?.slice(-3) ?? []
    });

    yield { event: 'role_complete', data: { role: 'intake', result: intakeResult }};

    // Handle clarification needed
    if (intakeResult?.needs_clarification) {
      yield { event: 'clarification_needed', data: {
        questions: intakeResult.clarification_questions ?? [],
        assumption: intakeResult.assumption_made ?? '',
        intent: intakeResult.intent,
        relevant_columns: intakeResult.relevant_columns ?? []
      }};
      return;
    }

    // ── PHASE 2: ARCHITECT ────────────────────────────────────────────
    yield { event: 'role_start', data: {
      role: 'architect', name: 'Architect Analyst', emoji: '📐',
      message: 'Building the analysis plan...'
    }};

    const archResult = await this._runRole('architect', prompt, {
      intake: intakeResult,
      schema,
      notebookContext: notebookContext?.slice(-3) ?? []
    });

    // Stream full plan immediately — ALL steps visible as PENDING
    const plan: any[] = (archResult?.plan ?? []).map((s: any) => ({ ...s, status: 'pending' }));
    yield { event: 'plan_ready', data: { plan }};

    // ── PHASE 3: EXECUTOR (step by step) ─────────────────────────────
    const allResults: any[] = [];

    for (const step of plan) {
      // Mark step RUNNING
      yield { event: 'plan_step_start', data: {
        step: step.step,
        title: step.title,
        type: step.type,
        description: step.description
      }};

      // Stream thinking tokens for this step
      yield* this._streamThinking(step, schema, allResults);

      // Generate code for this step
      const codeResult = await this._runRole('executor', prompt, {
        step,
        schema,
        previous_results: allResults.slice(-3).map(r => ({
          step: r.step.title,
          outputs: r.parsed
        })),
        intake: intakeResult
      });

      const code: string = codeResult?.code ?? '';
      const language: string = codeResult?.language ?? step.language ?? 'python';

      // Stream code block start
      yield { event: 'code_start', data: {
        step: step.step,
        language,
        title: step.title,
        subtitle: step.description ?? ''
      }};

      // Stream code character by character (4 chars per tick)
      for (let i = 0; i < code.length; i += 4) {
        yield { event: 'code_token', data: {
          token: code.slice(i, i + 4),
          step: step.step
        }};
        // Small delay creates the typing effect — skipped on server, rate-limited in frontend
        await new Promise(r => setTimeout(r, 6));
      }

      yield { event: 'code_complete', data: { step: step.step }};

      // Run in sandbox
      yield { event: 'sandbox_start', data: {
        step: step.step,
        message: 'Sending to sandbox...'
      }};

      let sandboxResult = await runInSandbox(code, dataSources as any);

      // Analyst reviews output — 3-pass check + auto-retry
      yield { event: 'sandbox_reviewing', data: {
        step: step.step,
        message: 'Reviewing output...'
      }};

      const [checkedResult, checkMessages] = await this.checker.checkAndRetry(
        step, code, sandboxResult, schema, dataSources as any
      );
      sandboxResult = checkedResult;

      // Emit the sandbox output
      yield { event: 'sandbox_running', data: {
        step: step.step,
        stdout: sandboxResult.stdout ?? '',
        stderr: sandboxResult.stderr ?? '',
        success: sandboxResult.success ?? false,
        check_messages: checkMessages
      }};

      // Parse structured outputs
      const parsed = this._parseSandboxOutput(sandboxResult);

      for (const chart of parsed.charts) {
        yield { event: 'chart_ready', data: chart };
      }
      for (const stat of parsed.stats) {
        yield { event: 'stat_ready', data: stat };
      }
      for (const insight of parsed.insights) {
        yield { event: 'insight_ready', data: insight };
      }

      // Mark step DONE / ERROR
      step.status = sandboxResult.success ? 'done' : 'error';
      allResults.push({ step, result: sandboxResult, parsed });

      yield { event: 'plan_step_done', data: {
        step: step.step,
        success: sandboxResult.success
      }};
    }

    // ── PHASE 4: NARRATOR ─────────────────────────────────────────────
    yield { event: 'role_start', data: {
      role: 'narrator', name: 'Narrator Analyst', emoji: '📖',
      message: 'Writing the analysis report...'
    }};

    const narratorResult = await this._runRole('narrator', prompt, {
      intake: intakeResult,
      plan,
      all_results: allResults.map(r => ({
        step_title: r.step.title,
        step_type: r.step.type,
        success: r.result.success,
        charts: r.parsed.charts.map((c: any) => ({ id: c.id, title: c.title })),
        stats: r.parsed.stats,
        insights: r.parsed.insights,
        stdout_excerpt: (r.result.stdout ?? '').slice(0, 500)
      }))
    });

    yield { event: 'report_ready', data: narratorResult };

    // ── COMPLETE ──────────────────────────────────────────────────────
    const totalCharts = allResults.reduce((n, r) => n + r.parsed.charts.length, 0);
    const totalInsights = allResults.reduce((n, r) => n + r.parsed.insights.length, 0);

    yield { event: 'analysis_complete', data: {
      total_steps: plan.length,
      charts_produced: totalCharts,
      insights_produced: totalInsights
    }};
  }

  /**
   * Run a role (non-streaming) and return parsed JSON result.
   */
  private async _runRole(roleName: string, prompt: string, context: Record<string, any>): Promise<any> {
    const role = ROLES[roleName];
    if (!role) throw new Error(`Unknown role: ${roleName}`);

    const contextStr = JSON.stringify(context, null, 2).slice(0, 8000);

    const userMessage = `
User's original prompt: "${prompt}"

Context:
${contextStr}

Respond with valid JSON only. No markdown fences. No explanation outside the JSON.
`;

    try {
      const response = await client.chat.completions.create({
        model: role.model,
        messages: [
          { role: 'system', content: role.systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: role.temperature,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(raw);
    } catch (err: any) {
      console.error(`[Team] Role "${roleName}" failed:`, err.message);
      return { error: err.message };
    }
  }

  /**
   * Stream thinking tokens for a specific step using GPT-4o-mini.
   */
  private async *_streamThinking(
    step: any,
    schema: any[],
    prevResults: any[]
  ): AsyncGenerator<SSEEvent> {
    const thinkingPrompt = `
You are a senior data analyst. Think out loud about how to approach this step:

Step: ${step.title}
Description: ${step.description}
Success condition: ${step.success_condition}
Previous results: ${prevResults.map(r => r.step.title).join(', ') || 'none yet'}

Think for 3-5 sentences about: what the data likely looks like, potential issues,
your approach, and what results you expect. Stream naturally, like thinking out loud.
No headers. Just flowing analytical thought.
`;

    try {
      const stream = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: thinkingPrompt }],
        stream: true,
        max_tokens: 200,
        temperature: 0.4
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield { event: 'thinking_token', data: { token: delta, step: step.step }};
        }
      }
    } catch (err: any) {
      // Thinking is non-critical — swallow errors silently
      console.warn('[Team] Thinking stream failed:', err.message);
    }
  }

  /**
   * Parse CHART_DATA:, STAT_DATA:, INSIGHT_DATA: lines from sandbox stdout.
   */
  private _parseSandboxOutput(result: any): { charts: any[]; stats: any[]; insights: any[] } {
    const charts: any[] = [];
    const stats: any[] = [];
    const insights: any[] = [];
    const stdout: string = result?.stdout ?? '';

    for (const line of stdout.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('CHART_DATA:')) {
        try { charts.push(JSON.parse(trimmed.slice(11))); } catch { /* ignore */ }
      } else if (trimmed.startsWith('STAT_DATA:')) {
        try { stats.push(JSON.parse(trimmed.slice(10))); } catch { /* ignore */ }
      } else if (trimmed.startsWith('INSIGHT_DATA:')) {
        try { insights.push(JSON.parse(trimmed.slice(13))); } catch { /* ignore */ }
      }
    }

    return { charts, stats, insights };
  }
}

export const analystTeam = new AnalystTeam();
