/**
 * DataIQ — E2B Sandbox Runner
 * Executes Python code safely in E2B cloud sandboxes.
 * Falls back to a no-op if E2B_API_KEY is not configured.
 */

export interface SandboxResult {
  stdout: string;
  stderr: string;
  chartData: any[];
  error: string | null;
  success: boolean;
}

/**
 * Build a Python preamble that auto-loads data files into the sandbox.
 */
function buildPreamble(dataSources: Array<{ type: string; filename?: string }>): string {
  const lines = [
    'import pandas as pd',
    'import numpy as np',
    'import json',
    'import warnings',
    "warnings.filterwarnings('ignore')",
    '',
  ];

  for (const source of dataSources) {
    if (source.type === 'file' && source.filename) {
      const varname = source.filename
        .replace(/\.(csv|xlsx|xls)$/i, '')
        .replace(/[-\s]/g, '_');

      if (source.filename.endsWith('.csv')) {
        lines.push(`${varname} = pd.read_csv("/data/${source.filename}")`);
      } else if (/\.(xlsx|xls)$/i.test(source.filename)) {
        lines.push(`${varname} = pd.read_excel("/data/${source.filename}")`);
      }
      lines.push(`df = ${varname}  # default df alias`);
    }
  }

  return lines.join('\n');
}

/**
 * Extract CHART_DATA:{...} lines from stdout.
 */
function extractChartData(stdout: string): any[] {
  const charts: any[] = [];
  for (const line of stdout.split('\n')) {
    if (line.startsWith('CHART_DATA:')) {
      try {
        const data = JSON.parse(line.slice('CHART_DATA:'.length));
        charts.push(data);
      } catch {
        // ignore malformed chart data
      }
    }
  }
  return charts;
}

/**
 * Run Python code in an E2B sandbox.
 * Requires E2B_API_KEY environment variable.
 */
export async function runInSandbox(
  code: string,
  dataSources: Array<{ type: string; filename?: string; content?: Buffer }>
): Promise<SandboxResult> {
  const apiKey = process.env.E2B_API_KEY;

  if (!apiKey) {
    console.warn('[Sandbox] E2B_API_KEY not set — returning mock sandbox result');
    return {
      stdout: '# Sandbox not configured — code was not executed',
      stderr: '',
      chartData: [],
      error: null,
      success: true,
    };
  }

  try {
    // Dynamic import — e2b is optional
    const { Sandbox } = await import('e2b');

    const sandbox = await Sandbox.create({
      apiKey,
      timeoutMs: 5 * 60 * 1000, // 5 minute timeout
    });

    try {
      // Upload data files into the sandbox
      for (const source of dataSources) {
        if (source.type === 'file' && source.filename && source.content) {
          await sandbox.files.write(`/data/${source.filename}`, source.content);
        }
      }

      // Inject data loading preamble
      const preamble = buildPreamble(dataSources);
      const fullCode = preamble + '\n\n' + code;

      // Execute
      const result = await sandbox.commands.run(`python3 -c "${fullCode.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`);

      const stdout = result.stdout || '';
      const stderr = result.stderr || '';
      const chartData = extractChartData(stdout);

      return {
        stdout,
        stderr,
        chartData,
        error: result.exitCode !== 0 ? stderr : null,
        success: result.exitCode === 0,
      };
    } finally {
      await sandbox.kill();
    }
  } catch (err: any) {
    console.error('[Sandbox] Execution error:', err.message);
    return {
      stdout: '',
      stderr: err.message,
      chartData: [],
      error: err.message,
      success: false,
    };
  }
}
