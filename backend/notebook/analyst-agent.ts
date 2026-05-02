/**
 * DataIQ — AI Analyst Agent
 * Orchestrates: Prompt → OpenAI GPT-4o → Parse → (Optional Sandbox) → Stream
 *
 * Produces SSE events that the frontend consumes:
 *   - status: { message, stage }
 *   - thinking_token: { token }
 *   - sandbox_result: { stdout, chartData, error }
 *   - complete: { ...CellData shape }
 *   - error: { message }
 */

import OpenAI from 'openai';
import { ANALYST_SYSTEM_PROMPT } from './prompts';
import { buildDataContext, type DataSourceSpec } from './data-loader';
import { runInSandbox } from './sandbox';

/** When the model omits suggested_prompts, the UI still shows four follow-ups. */
const DEFAULT_SUGGESTED_PROMPTS = [
  'Which internet service type has the highest churn rate?',
  'Build a churn prediction model and show feature importance',
  'Calculate the revenue impact if we reduce churn by 10%',
  'Show me the payment method breakdown for churned customers',
];

// ─── Types matching the CellData interface in the frontend ──────────────

export interface AnalysisRequest {
  prompt: string;
  dataSources: DataSourceSpec[];
  notebookContext?: Array<{ prompt: string; resultSummary?: string }>;
  useThinking?: boolean;
}

export interface SSEEvent {
  event: string;
  data: any;
}

// ─── Agent ──────────────────────────────────────────────────────────────

export class AnalystAgent {
  private client: OpenAI;
  private hasConfiguredKey: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.hasConfiguredKey = Boolean(apiKey);
    if (!apiKey) {
      console.warn('[Agent] OPENAI_API_KEY not set — agent will return fallback responses');
    }
    this.client = new OpenAI({ apiKey: apiKey || 'dummy' });
  }

  /**
   * Main analysis entry point.
   * Returns an async generator of SSE events.
   */
  async *analyze(request: AnalysisRequest): AsyncGenerator<SSEEvent> {
    const { prompt, dataSources, notebookContext, useThinking } = request;
    const startTime = Date.now();

    // If key appears later (after dotenv loads), reinitialize client once.
    if (!this.hasConfiguredKey && process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.hasConfiguredKey = true;
    }

    // If no API key, return a helpful error
    if (!process.env.OPENAI_API_KEY) {
      yield {
        event: 'error',
        data: {
          message: 'OpenAI API key not configured. Set OPENAI_API_KEY in your .env file.',
          type: 'ConfigError',
        },
      };
      return;
    }

    try {
      // 1. Build data context
      yield { event: 'status', data: { message: 'Loading data context...', stage: 'loading' } };
      const dataContext = await buildDataContext(dataSources);

      // 2. Build messages
      const messages = this.buildMessages(prompt, dataContext, notebookContext);

      // 3. Stream from OpenAI
      yield { event: 'status', data: { message: 'AI analyst is thinking...', stage: 'thinking' } };

      let fullResponse = '';
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages,
        stream: true,
        temperature: 0.1,
        max_tokens: 4000,
      });

      let hasEnteredPlan = false;
      let hasEnteredCode = false;
      let hasEnteredInsights = false;
      let hasStartedFinalJson = false;
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          const lower = fullResponse.toLowerCase();

          if (!hasEnteredPlan && lower.includes('<plan>')) {
            hasEnteredPlan = true;
            yield { event: 'status', data: { message: 'Building implementation plan...', stage: 'planning' } };
          }
          if (!hasEnteredCode && lower.includes('<code')) {
            hasEnteredCode = true;
            yield { event: 'status', data: { message: 'Writing analysis code...', stage: 'coding' } };
          }
          if (!hasEnteredInsights && lower.includes('<insights>')) {
            hasEnteredInsights = true;
            yield { event: 'status', data: { message: 'Drafting analyst insights...', stage: 'reporting' } };
          }
          if (!hasStartedFinalJson && lower.includes('<dataiq_response>')) {
            hasStartedFinalJson = true;
            yield { event: 'status', data: { message: 'Finalizing structured results...', stage: 'finalizing' } };
          }

          // Stream all pre-final-JSON tokens so user can watch live thinking/plan/code/report typing.
          if (!hasStartedFinalJson) {
            yield { event: 'thinking_token', data: { token: delta } };
          }
        }
      }

      // 4. Parse the structured response
      yield { event: 'status', data: { message: 'Processing results...', stage: 'processing' } };

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const structured = this.parseResponse(fullResponse, elapsed);

      // 5. Optionally run code in sandbox
      if (structured.codeBlocks?.length > 0) {
        const pythonBlocks = structured.codeBlocks.filter(
          (b: any) => b.lang === 'PYTHON' || b.lang === 'python'
        );
        if (pythonBlocks.length > 0 && process.env.E2B_API_KEY) {
          yield { event: 'status', data: { message: 'Running code in sandbox...', stage: 'sandbox' } };
          for (const block of pythonBlocks) {
            const result = await runInSandbox(block.code, dataSources as any);
            yield { event: 'sandbox_result', data: result };

            // Enrich charts with real sandbox data
            if (result.chartData?.length > 0) {
              structured.charts = structured.charts || [];
              const normalized = this.normalizeCharts(result.chartData);
              for (const chart of normalized) structured.charts.push(chart);
              structured.chartData = this.buildChartDataMap(structured.charts);
            }
          }
        }
      }

      // 6. Yield final complete response
      yield { event: 'complete', data: structured };

    } catch (err: any) {
      console.error('[Agent] Analysis error:', err);
      yield {
        event: 'error',
        data: {
          message: err.message || 'Analysis failed',
          type: err.constructor?.name || 'Error',
        },
      };
    }
  }

  /**
   * Build the message array for OpenAI.
   */
  private buildMessages(
    prompt: string,
    dataContext: any[],
    notebookContext?: Array<{ prompt: string; resultSummary?: string }>
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: ANALYST_SYSTEM_PROMPT },
    ];

    // Add notebook history for conversational context (last 5 cells)
    if (notebookContext?.length) {
      for (const cell of notebookContext.slice(-5)) {
        messages.push({ role: 'user', content: cell.prompt });
        if (cell.resultSummary) {
          messages.push({ role: 'assistant', content: cell.resultSummary });
        }
      }
    }

    // Main user message with data context
    const userMessage = `
## Data Sources Available
${JSON.stringify(dataContext, null, 2)}

## User's Analysis Request
${prompt}

Remember: Return your full analysis including the <DATAIQ_RESPONSE> JSON block at the end.
`;
    messages.push({ role: 'user', content: userMessage });
    return messages;
  }

  /**
   * Parse the <DATAIQ_RESPONSE> JSON from the AI's response.
   * Falls back gracefully if parsing fails.
   */
  private parseResponse(response: string, execTime: string): any {
    // Try to extract JSON from <DATAIQ_RESPONSE> tags
    const match = response.match(/<DATAIQ_RESPONSE>([\s\S]*?)<\/DATAIQ_RESPONSE>/);

    if (match) {
      try {
        const parsed = JSON.parse(match[1].trim());

        const rawPlan = parsed.plan ?? parsed.steps;
        const plan = Array.isArray(rawPlan)
          ? rawPlan.map((p: any) => {
              if (typeof p === 'string') return p;
              if (p && typeof p.description === 'string') return p.description;
              if (p && typeof p.step === 'string') return p.step;
              return String(p ?? '');
            }).filter(Boolean)
          : [];

        const rawBlocks = parsed.code_blocks ?? parsed.codeBlocks;
        const codeBlocks = Array.isArray(rawBlocks)
          ? rawBlocks.map((b: any) => ({
              lang: String(b.language || b.lang || 'PYTHON').toUpperCase(),
              label: b.title || b.subtitle || b.label || 'Generated analysis code',
              code: b.code || '',
            }))
          : [];

        const insights = Array.isArray(parsed.insights)
          ? parsed.insights.map((i: any) => this.normalizeInsight(i))
          : [];

        const rawCharts = parsed.charts ?? parsed.chart_specs ?? parsed.visualizations;
        const charts = this.normalizeCharts(Array.isArray(rawCharts) ? rawCharts : []);

        const thinkingRaw = parsed.thinking ?? parsed.reasoning ?? parsed.thoughts;
        const thinking = Array.isArray(thinkingRaw)
          ? thinkingRaw.map((t: any) => (typeof t === 'string' ? t : String(t ?? ''))).filter(Boolean)
          : typeof thinkingRaw === 'string'
            ? [thinkingRaw]
            : [];

        const stats = parsed.stats ?? parsed.kpis ?? [];

        // Ensure required fields exist with defaults for existing UI tree.
        return {
          thinking,
          thinkingOpen: false,
          plan,
          codeBlocks,
          stats,
          charts,
          chartData: this.buildChartDataMap(charts),
          insights,
          summary: this.normalizeSummary(parsed),
          tableData: parsed.tableData ?? parsed.table_data ?? null,
          qualityScore: parsed.qualityScore ?? parsed.quality_score ?? null,
          execMsg:
            parsed.execMsg ||
            parsed.exec_msg ||
            `Analysis complete · ${(parsed.data_sources_used || []).join(' + ') || 'data processed'}`,
          execTime: parsed.execTime || parsed.execution_time || `${execTime}s`,
        };
      } catch (e) {
        console.error('[Agent] JSON parse error:', e);
      }
    }

    // Fallback: return the raw text as a summary
    return this.buildFallbackResponse(response, execTime);
  }

  /**
   * Build chartData map from charts array.
   * Converts: [{ id, data, colors }] → { [id]: { data, colors } }
   */
  private buildChartDataMap(charts: any[]): Record<string, any> {
    const map: Record<string, any> = {};
    for (const chart of charts) {
      if (chart.id) {
        map[chart.id] = {
          data: chart.data || [],
          colors: chart.colors || ['#0E50F6', '#10B981', '#F43F5E', '#F59E0B'],
        };
      }
    }
    return map;
  }

  private normalizeCharts(charts: any[]): Array<{ title: string; sub: string; id: string; type: 'bar'|'line'|'area'|'horizontal-bar'; data?: any[]; colors?: string[] }> {
    return (charts || []).map((chart: any, index: number) => {
      const id = chart.id || `chart-${index + 1}`;
      const datasets = Array.isArray(chart.datasets) ? chart.datasets : [];
      const labels = Array.isArray(chart.labels) ? chart.labels : [];
      const data =
        chart.data ||
        (labels.length > 0 && datasets.length > 0
          ? labels.map((label: string, i: number) => {
              const row: Record<string, any> = { name: label };
              for (const ds of datasets) {
                row[ds.label || 'value'] = Array.isArray(ds.data) ? ds.data[i] : null;
              }
              if (datasets[0]?.data?.[i] !== undefined) row.value = datasets[0].data[i];
              return row;
            })
          : []);

      const type = (chart.type === 'scatter'
        ? 'line'
        : chart.type === 'pie'
          ? 'bar'
          : chart.type === 'histogram'
            ? 'bar'
            : chart.type === 'heatmap'
              ? 'area'
              : chart.type || 'bar') as 'bar'|'line'|'area'|'horizontal-bar';
      const colors = chart.colors || datasets[0]?.colors || (datasets[0]?.color ? [datasets[0].color] : undefined);

      return {
        title: chart.title || 'Chart',
        sub: chart.sub || chart.subtitle || '',
        id,
        type,
        data,
        colors,
      };
    });
  }

  /**
   * Normalize summary + always attach ≥4 suggested follow-up prompts for the notebook UI.
   */
  private normalizeSummary(parsed: Record<string, unknown>): {
    paragraphs: string[];
    highlights?: Array<{ label: string; value: string; color: string }>;
    suggestedPrompts: string[];
  } {
    const raw = (parsed.summary ?? parsed.report) as Record<string, unknown> | string | null | undefined;
    let paragraphs: string[] = [];
    if (typeof raw === 'string') {
      paragraphs = [raw];
    } else if (raw && typeof raw === 'object' && Array.isArray((raw as any).paragraphs)) {
      paragraphs = ((raw as any).paragraphs as unknown[]).map((p) => String(p ?? '')).filter(Boolean);
    }

    let suggested: string[] = [];
    if (raw && typeof raw === 'object') {
      const r = raw as Record<string, unknown>;
      const s =
        r.suggested_prompts ?? r.suggestedPrompts ?? parsed.suggested_prompts ?? parsed.suggestedPrompts;
      if (Array.isArray(s)) {
        suggested = s.map((x) => String(x ?? '').trim()).filter(Boolean);
      }
    } else {
      const s = parsed.suggested_prompts ?? parsed.suggestedPrompts;
      if (Array.isArray(s)) {
        suggested = s.map((x) => String(x ?? '').trim()).filter(Boolean);
      }
    }

    while (suggested.length < 4) {
      suggested.push(DEFAULT_SUGGESTED_PROMPTS[suggested.length % DEFAULT_SUGGESTED_PROMPTS.length]);
    }

    let highlights: Array<{ label: string; value: string; color: string }> | undefined;
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).highlights)) {
      highlights = (raw as any).highlights;
    }

    if (paragraphs.length === 0) {
      paragraphs = ['Review the plan, code, and key insights above for the full analysis.'];
    }

    return {
      paragraphs,
      highlights,
      suggestedPrompts: suggested.slice(0, 8),
    };
  }

  private normalizeInsight(insight: any): { icon: string; color: string; title: string; text: string; pinned: boolean } {
    if (insight?.severity) {
      const map: Record<string, { icon: string; color: string }> = {
        critical: { icon: '🚨', color: 'rose' },
        warning: { icon: '⚠️', color: 'amber' },
        positive: { icon: '✅', color: 'emerald' },
        info: { icon: '💡', color: 'blue' },
        model: { icon: '🤖', color: 'violet' },
      };
      const mapped = map[insight.severity] || map.info;
      return {
        icon: mapped.icon,
        color: mapped.color,
        title: insight.title || 'Insight',
        text: [insight.body, insight.action ? `Action: ${insight.action}` : ''].filter(Boolean).join('\n'),
        pinned: Boolean(insight.pinned),
      };
    }

    return {
      icon: insight?.icon || '💡',
      color: insight?.color || 'blue',
      title: insight?.title || 'Insight',
      text: insight?.text || insight?.body || '',
      pinned: Boolean(insight?.pinned),
    };
  }

  /**
   * Graceful fallback when JSON parsing fails.
   */
  private buildFallbackResponse(rawText: string, execTime: string): any {
    return {
      thinking: ['Analysis complete — see summary below'],
      thinkingOpen: false,
      plan: ['Analyzed the user request', 'Generated response'],
      codeBlocks: [],
      stats: [],
      charts: [],
      chartData: {},
      insights: [{
        icon: '💡',
        color: 'blue',
        title: 'Analysis Result',
        text: rawText.slice(0, 500),
        pinned: false,
      }],
      summary: {
        paragraphs: [rawText.slice(0, 2000)],
        highlights: [],
        suggestedPrompts: [...DEFAULT_SUGGESTED_PROMPTS],
      },
      tableData: null,
      qualityScore: null,
      execMsg: 'Analysis complete',
      execTime: `${execTime}s`,
    };
  }
}

export const analystAgent = new AnalystAgent();
