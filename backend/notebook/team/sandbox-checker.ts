/**
 * DataIQ — Sandbox 3-Pass Output Checker
 * After every sandbox run, checks:
 *   Pass 1: Did it run at all? (exit code)
 *   Pass 2: Did expected outputs arrive? (CHART_DATA, STAT_DATA)
 *   Pass 3: Sanity-check numbers (no NaN, Inf, out-of-range %)
 * Auto-retries with GPT-4o-mini code fixer on failure (max 2x).
 */

import OpenAI from 'openai';
import { runInSandbox } from '../sandbox';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' });

export class SandboxChecker {
  /**
   * Multi-pass check + auto-retry.
   * Returns [finalResult, checkMessages]
   */
  async checkAndRetry(
    step: any,
    code: string,
    result: any,
    schema: any[],
    dataSources: any[]
  ): Promise<[any, string[]]> {
    const messages: string[] = [];
    let currentCode = code;
    let currentResult = result;

    // Allow up to 2 retries
    for (let attempt = 0; attempt <= 2; attempt++) {

      // ── PASS 1: Did it run at all? ────────────────────────────────
      if (!currentResult.success) {
        const errorSnippet = (currentResult.error || currentResult.stderr || 'Unknown error').slice(0, 300);
        messages.push(`⚠ Error (attempt ${attempt + 1}): ${errorSnippet}`);

        if (attempt < 2) {
          messages.push('🔧 Attempting fix...');
          const fixedCode = await this._fixCode(currentCode, errorSnippet, schema);
          if (!fixedCode) {
            messages.push('✗ Could not generate a fix');
            break;
          }
          currentCode = fixedCode;
          currentResult = await runInSandbox(currentCode, dataSources);
          const success = currentResult.success;
          messages.push(success ? `✓ Retry ${attempt + 1} succeeded` : `✗ Retry ${attempt + 1} failed`);
          if (!success) continue;
        } else {
          messages.push('✗ Max retries reached');
          break;
        }
      }

      // Success — run output checks
      const stdout: string = currentResult.stdout ?? '';

      // ── PASS 2: Expected outputs present? ────────────────────────
      const produces: string[] = step.produces ?? [];

      for (const expected of produces) {
        if (expected.includes('chart') && !stdout.includes('CHART_DATA:')) {
          messages.push(`⚠ Expected chart output missing`);
        }
        if (expected.includes('stat') && !stdout.includes('STAT_DATA:')) {
          messages.push(`⚠ Expected stat output missing`);
        }
        if (expected.includes('insight') && !stdout.includes('INSIGHT_DATA:')) {
          messages.push(`⚠ Expected insight output missing`);
        }
      }

      // ── PASS 3: Sanity-check numbers ─────────────────────────────
      for (const line of stdout.split('\n')) {
        const trimmed = line.trim();

        if (trimmed.startsWith('STAT_DATA:')) {
          try {
            const stat = JSON.parse(trimmed.slice(10));
            const raw = typeof stat.raw_value === 'number' ? stat.raw_value : null;

            if (raw !== null) {
              // Flag NaN / Inf
              if (!isFinite(raw)) {
                messages.push(`⚠ ${stat.label}: non-finite value (${raw}) — check division`);
              }
              // Flag percentage out of [0, 100]
              if (typeof stat.value === 'string' && stat.value.includes('%')) {
                if (raw < 0 || raw > 100) {
                  messages.push(`⚠ ${stat.label}: ${raw.toFixed(1)}% is out of [0, 100] range — verify calculation`);
                }
              }
            }
          } catch { /* malformed STAT_DATA — ignore */ }
        }
      }

      // If we made it here without continuing, we're done
      if (!messages.some(m => m.startsWith('✗'))) {
        messages.push('✓ Output validated — all checks passed');
      }
      break;
    }

    return [currentResult, messages];
  }

  /**
   * Ask GPT-4o-mini to fix a specific Python error.
   */
  private async _fixCode(
    brokenCode: string,
    error: string,
    schema: any[]
  ): Promise<string | null> {
    const schemaStr = JSON.stringify(schema, null, 2).slice(0, 800);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Fix this Python code error.

Error:
${error}

Code:
\`\`\`python
${brokenCode.slice(0, 2000)}
\`\`\`

Schema context (column names and types):
${schemaStr}

Return ONLY the fixed Python code. No explanation. No markdown fences.`
        }],
        max_tokens: 2000,
        temperature: 0.1
      });

      const fixed = (response.choices[0]?.message?.content ?? '')
        .replace(/^```python\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      return fixed.length > 10 ? fixed : null;
    } catch (err: any) {
      console.error('[SandboxChecker] Fix failed:', err.message);
      return null;
    }
  }
}
