/**
 * DataIQ — Streaming SSE Types
 * Defines every SSE event type and payload shape for the AI Analyst Team.
 */

export type SSEEventType =
  | 'role_start'
  | 'role_complete'
  | 'clarification_needed'
  | 'plan_ready'
  | 'plan_step_start'
  | 'plan_step_done'
  | 'thinking_token'
  | 'code_start'
  | 'code_token'
  | 'code_complete'
  | 'sandbox_start'
  | 'sandbox_running'
  | 'sandbox_reviewing'
  | 'chart_ready'
  | 'stat_ready'
  | 'insight_ready'
  | 'report_ready'
  | 'analysis_complete'
  | 'error';

export type CellStatus =
  | 'idle'
  | 'intake'
  | 'clarification'
  | 'planning'
  | 'executing'
  | 'narrating'
  | 'complete'
  | 'error';

export type PlanStepStatus = 'pending' | 'running' | 'done' | 'error';

export interface PlanStep {
  step: number;
  type: string;
  title: string;
  description: string;
  success_condition: string;
  estimated_seconds: number;
  language: 'python' | 'sql';
  status: PlanStepStatus;
  produces?: string[];
}

export interface StreamingCodeBlock {
  language: 'python' | 'sql';
  title: string;
  subtitle: string;
  code: string;         // accumulates code_token events
  isStreaming: boolean;
}

export interface SandboxOutput {
  stdout: string;
  stderr: string;
  success: boolean;
  check_messages: string[];
}

export interface ChartData {
  id: string;
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'histogram' | 'heatmap' | 'box' | 'area' | 'horizontal-bar';
  title: string;
  subtitle?: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    colors?: string[];
    color?: string;
  }>;
  xLabel?: string;
  yLabel?: string;
  annotations?: Array<{ value: number; label: string; color: string; axis: 'x' | 'y' }>;
  pinned?: boolean;
}

export interface StatData {
  label: string;
  value: string;
  raw_value?: number;
  delta?: string;
  color?: 'red' | 'green' | 'blue' | 'amber' | 'purple' | 'neutral';
  significance?: string;
  // Legacy support
  deltaColor?: string;
}

export interface InsightData {
  id?: string;
  severity?: 'critical' | 'warning' | 'positive' | 'info' | 'model';
  title: string;
  body?: string;
  text?: string;          // legacy
  action?: string;
  metric?: string;
  impact?: string;
  pinnable?: boolean;
  pinned?: boolean;
  // Legacy icon / color
  icon?: string;
  color?: string;
}

export interface KeyFinding {
  weight: 'critical' | 'warning' | 'positive' | 'info' | 'model';
  finding: string;
  number: string;
  context: string;
  plain_english: string;
}

export interface ReportAction {
  priority: number;
  timeframe: string;
  action: string;
  expected_impact: string;
}

export interface NarratorReport {
  question: string;
  data_summary: string;
  method_summary: string;
  key_findings: KeyFinding[];
  actions: ReportAction[];
  lessons_learned: string[];
  next_questions: string[];
  confidence: 'high' | 'medium' | 'low';
  confidence_reason: string;
}

export interface ClarificationData {
  questions: string[];
  assumption?: string;
  intent?: string;
  relevant_columns?: string[];
}

export interface LiveCell {
  id: string;
  prompt: string;
  status: CellStatus;
  num?: number;

  // Role tracking
  currentRole?: string;
  currentRoleMessage?: string;
  streamingThinking: string;          // accumulates thinking_token events
  currentStep?: number;

  // Clarification
  clarification?: ClarificationData;

  // Plan
  plan: PlanStep[];

  // Code blocks keyed by step number
  codeBlocks: Record<number, StreamingCodeBlock>;

  // Sandbox outputs keyed by step number
  sandboxOutputs: Record<number, SandboxOutput>;

  // Accumulated results
  charts: ChartData[];
  stats: StatData[];
  insights: InsightData[];

  // Report
  report?: NarratorReport;
  suggestedPrompts?: string[];

  // Legacy / table data
  tableData?: { headers: string[]; rows: any[][] } | null;
  qualityScore?: string | null;
  execTime?: string;
  error?: string;
}
