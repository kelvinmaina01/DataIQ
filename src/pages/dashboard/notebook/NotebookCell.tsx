import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin } from 'lucide-react';
import { PlanTracker } from './PlanTracker';
import { StreamingCodeBlock } from './StreamingCodeBlock';
import { SandboxOutput } from './SandboxOutput';
import { AnalysisReport } from './AnalysisReport';
import type { LiveCell } from '../../../types/streaming';

const STAT_COLORS: Record<string, string> = {
  red: '#F87171', green: '#34D399', blue: '#60A5FA',
  amber: '#FCD34D', purple: '#C4B5FD', neutral: '#94A3B8',
};

const SEV_STYLES: Record<string, { bg: string; border: string; badge: string; badgeColor: string }> = {
  critical: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.22)', badge: 'rgba(239,68,68,0.15)', badgeColor: '#FCA5A5' },
  warning:  { bg: 'rgba(217,119,6,0.06)',  border: 'rgba(217,119,6,0.22)',  badge: 'rgba(217,119,6,0.15)',  badgeColor: '#FCD34D' },
  positive: { bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.18)',  badge: 'rgba(34,197,94,0.12)',  badgeColor: '#86EFAC' },
  info:     { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.18)', badge: 'rgba(59,130,246,0.12)', badgeColor: '#93C5FD' },
  model:    { bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.18)', badge: 'rgba(124,58,237,0.12)', badgeColor: '#C4B5FD' },
};

const SEV_LABELS: Record<string, string> = {
  critical: '🔴 Critical', warning: '🟡 Warning',
  positive: '🟢 Positive', info: '🔵 Insight', model: '🟣 ML',
};

const ROLE_EMOJIS: Record<string, string> = {
  intake: '🔍', architect: '📐', executor: '⚡', narrator: '📖',
};

export function LiveCellRenderer({
  cell,
  onPin,
  onPinChart,
  onSuggest,
}: {
  cell: LiveCell;
  onPin?: (cellId: string, idx: number) => void;
  onPinChart?: (cellId: string, idx: number) => void;
  onSuggest?: (prompt: string) => void;
}) {
  const [thinkOpen, setThinkOpen] = useState(false);
  const isRunning = ['intake', 'planning', 'executing', 'narrating'].includes(cell.status);

  return (
    <div style={{ position: 'relative', paddingLeft: 40, marginBottom: 12 }}>
      {/* Gutter */}
      <div style={{ position: 'absolute', left: 0, top: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#475569', width: 24, textAlign: 'right' }}>
          [{cell.num ?? '?'}]
        </span>
        {isRunning && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6' }}
          />
        )}
      </div>

      {/* Prompt box */}
      <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(14,80,246,0.1)', color: '#0E50F6', fontFamily: 'monospace' }}>
            PROMPT
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Analysis</span>
          {cell.status !== 'idle' && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#475569' }}>
              {ROLE_EMOJIS[cell.currentRole ?? ''] ?? ''} {cell.currentRoleMessage ?? cell.status}
            </span>
          )}
        </div>
        <div style={{ padding: '10px 14px', fontSize: 14, color: '#1E293B', lineHeight: 1.7 }}>
          {cell.prompt}
        </div>
      </div>

      {/* Thinking bubble */}
      {cell.streamingThinking && (
        <div style={{ marginBottom: 6 }}>
          <button
            onClick={() => setThinkOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0', fontSize: 11, color: '#6D28D9' }}
          >
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>💭</motion.span>
            <span>Thinking... {!thinkOpen && '(click to expand)'}</span>
          </button>
          <AnimatePresence>
            {thinkOpen && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                style={{ overflow: 'hidden', background: 'rgba(109,40,217,0.04)', border: '1px solid rgba(109,40,217,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#7C3AED', lineHeight: 1.7 }}
              >
                {cell.streamingThinking}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Clarification card */}
      {cell.status === 'clarification' && cell.clarification && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', marginBottom: 8 }}>
            🤔 Need a bit more info
          </div>
          {cell.clarification.assumption && (
            <div style={{ fontSize: 11, color: '#92400E', marginBottom: 10 }}>
              Best guess: {cell.clarification.assumption}
            </div>
          )}
          {cell.clarification.questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#F59E0B', fontSize: 12 }}>{i + 1}.</span>
              <span style={{ fontSize: 12, color: '#B45309' }}>{q}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Plan tracker */}
      {cell.plan.length > 0 && (
        <PlanTracker plan={cell.plan} currentStep={cell.currentStep} />
      )}

      {/* Step outputs */}
      {cell.plan.map(step => {
        const code = cell.codeBlocks[step.step];
        const sandbox = cell.sandboxOutputs[step.step];
        return (
          <div key={step.step}>
            {code && (
              <StreamingCodeBlock
                step={step.step}
                language={code.language}
                title={code.title}
                subtitle={code.subtitle}
                code={code.code}
                isStreaming={code.isStreaming}
              />
            )}
            {sandbox && <SandboxOutput stepNum={step.step} output={sandbox} />}
          </div>
        );
      })}

      {/* Stats */}
      {cell.stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
          {cell.stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: STAT_COLORS[s.color ?? 'neutral'] ?? '#94A3B8' }}>{s.value}</div>
              {s.delta && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{s.delta}</div>}
              {s.significance && <div style={{ fontSize: 10, color: '#334155' }}>{s.significance}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {cell.insights.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Key Insights</div>
          {cell.insights.map((ins, i) => {
            const sev = ins.severity ?? 'info';
            const st = SEV_STYLES[sev] ?? SEV_STYLES.info;
            return (
              <motion.div
                key={ins.id ?? i}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 7, display: 'flex', gap: 10 }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: st.badge, color: st.badgeColor }}>
                      {SEV_LABELS[sev]}
                    </span>
                    {ins.metric && <span style={{ fontSize: 16, fontWeight: 700, color: st.badgeColor, fontFamily: 'monospace' }}>{ins.metric}</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E1', marginBottom: 4 }}>{ins.title}</div>
                  {(ins.body ?? ins.text) && <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65 }}>{ins.body ?? ins.text}</div>}
                  {ins.action && <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>→ {ins.action}</div>}
                  {ins.impact && <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>{ins.impact}</div>}
                </div>
                {ins.pinnable !== false && (
                  <button
                    onClick={() => onPin?.(cell.id, i)}
                    style={{
                      alignSelf: 'flex-start', flexShrink: 0, fontSize: 10, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                      background: ins.pinned ? 'rgba(14,80,246,0.1)' : 'rgba(255,255,255,0.05)',
                      border: ins.pinned ? '1px solid rgba(14,80,246,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      color: ins.pinned ? '#60A5FA' : '#475569',
                    }}
                  >
                    <Pin size={10} style={{ display: 'inline', marginRight: 3 }} />
                    {ins.pinned ? 'Pinned' : 'Pin'}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Final report */}
      {cell.report && (
        <AnalysisReport
          report={cell.report}
          suggestedPrompts={cell.suggestedPrompts}
          onSuggestedPrompt={onSuggest}
        />
      )}

      {/* Error state */}
      {cell.status === 'error' && cell.error && (
        <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#F87171' }}>
          ✗ {cell.error}
        </div>
      )}

      {/* Complete footer */}
      {cell.status === 'complete' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', fontSize: 11, color: '#475569' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
          Analysis complete · {cell.plan.filter(s => s.status === 'done').length}/{cell.plan.length} steps
        </div>
      )}
    </div>
  );
}

// ── Legacy CellData renderer (kept for mock/session cells) ─────────────────

export { NotebookCellRenderer } from './LegacyNotebookCell';
