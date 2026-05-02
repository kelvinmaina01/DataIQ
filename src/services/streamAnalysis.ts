/**
 * DataIQ — Stream Analysis Service
 * Complete SSE consumer wired to the new 4-role AI Analyst Team.
 * Handles every event type and dispatches to the Zustand store.
 */

import { useNotebookStore } from '../stores/notebookStore';

const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Stream an analysis for a cell.
 * Opens the SSE connection, dispatches all events to the store,
 * and resolves when the stream ends.
 */
export async function streamAnalysis(
  cellId: string,
  prompt: string,
  dataSources: any[],
  notebookContext?: Array<{ prompt: string; resultSummary?: string }>
): Promise<void> {
  const store = useNotebookStore.getState();

  // Reset + set initial state
  store.resetCell(cellId);
  store.updateCell(cellId, { prompt, status: 'intake' });

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/notebook/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        dataSources: dataSources.map(s => ({
          id: s.id, type: s.type, name: s.name, filename: s.filename,
        })),
        data_sources: dataSources.map(s => ({
          id: s.id, type: s.type, name: s.name, filename: s.filename,
        })),
        notebookContext,
        notebook_context: notebookContext,
      }),
    });
  } catch (err: any) {
    store.updateCell(cellId, { status: 'error', error: `Network error: ${err.message}` });
    return;
  }

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    store.updateCell(cellId, {
      status: 'error',
      error: `Server error (${response.status}): ${text}`,
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const raw of lines) {
      const line = raw.replace(/\r$/, '');
      if (!line.trim()) continue;

      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
        continue;
      }

      if (line.startsWith('data: ') && currentEvent) {
        try {
          const payload = JSON.parse(line.slice(6));
          handleEvent(currentEvent, payload, cellId);
        } catch {
          /* ignore malformed data lines */
        }
        currentEvent = '';
      }
    }
  }
}

/** Dispatch a single SSE event to the Zustand store. */
function handleEvent(event: string, payload: any, cellId: string): void {
  const store = useNotebookStore.getState();

  switch (event) {

    case 'role_start':
      store.updateCell(cellId, {
        status:
          payload.role === 'architect' ? 'planning'
          : payload.role === 'executor' ? 'executing'
          : payload.role === 'narrator' ? 'narrating'
          : 'intake',
        currentRole: payload.role,
        currentRoleMessage: payload.message,
        streamingThinking: '',     // reset thinking for new role
      });
      break;

    case 'role_complete':
      // No UI change needed — role_start handles transitions
      break;

    case 'clarification_needed':
      store.setClarification(cellId, {
        questions: payload.questions ?? [],
        assumption: payload.assumption,
        intent: payload.intent,
        relevant_columns: payload.relevant_columns ?? [],
      });
      break;

    case 'plan_ready':
      // All steps arrive as PENDING — user sees the full roadmap immediately
      store.updateCell(cellId, {
        plan: (payload.plan ?? []).map((s: any) => ({ ...s, status: 'pending' })),
        streamingThinking: '',
      });
      break;

    case 'plan_step_start':
      store.updatePlanStep(cellId, payload.step, { status: 'running' });
      store.updateCell(cellId, {
        currentStep: payload.step,
        streamingThinking: '',   // reset thinking per step
      });
      break;

    case 'plan_step_done':
      store.updatePlanStep(cellId, payload.step, {
        status: payload.success ? 'done' : 'error',
      });
      break;

    case 'thinking_token':
      store.appendThinking(cellId, payload.token ?? '');
      break;

    case 'code_start':
      store.initCodeBlock(cellId, payload.step, {
        language: payload.language ?? 'python',
        title: payload.title ?? '',
        subtitle: payload.subtitle ?? '',
        code: '',
        isStreaming: true,
      });
      break;

    case 'code_token':
      store.appendCode(cellId, payload.step, payload.token ?? '');
      break;

    case 'code_complete':
      store.finalizeCode(cellId, payload.step);
      break;

    case 'sandbox_start':
      store.updateCell(cellId, { currentRoleMessage: payload.message });
      break;

    case 'sandbox_running':
      store.setSandboxOutput(cellId, payload.step, {
        stdout: payload.stdout ?? '',
        stderr: payload.stderr ?? '',
        success: payload.success ?? false,
        check_messages: payload.check_messages ?? [],
      });
      break;

    case 'sandbox_reviewing':
      store.updateCell(cellId, { currentRoleMessage: payload.message });
      break;

    case 'chart_ready':
      store.addChart(cellId, payload);
      break;

    case 'stat_ready':
      store.addStat(cellId, payload);
      break;

    case 'insight_ready':
      store.addInsight(cellId, payload);
      break;

    case 'report_ready': {
      const report = payload?.report ?? payload;
      const suggested = payload?.suggested_prompts ?? [];
      store.setReport(cellId, report, suggested);
      break;
    }

    case 'analysis_complete':
      store.updateCell(cellId, {
        status: 'complete',
        currentRole: undefined,
        currentRoleMessage: undefined,
      });
      break;

    case 'error':
      store.updateCell(cellId, {
        status: 'error',
        error: payload.message ?? 'Unknown error',
      });
      break;
  }
}
