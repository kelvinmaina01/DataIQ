/**
 * DataIQ — Analysis Report Component (Storytelling Format)
 * Renders the Narrator's final report in the 6-Act storytelling structure.
 * Spec Section 8.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NarratorReport, KeyFinding, ReportAction } from '../../types/streaming';

// ─── Weight / severity styles ────────────────────────────────────────────

const WEIGHT_STYLES: Record<string, {
  bg: string; border: string; numColor: string;
  badge: { bg: string; color: string; label: string };
}> = {
  critical: {
    bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', numColor: '#FCA5A5',
    badge: { bg: 'rgba(239,68,68,0.15)', color: '#FCA5A5', label: '🔴 Critical' },
  },
  warning: {
    bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)', numColor: '#FCD34D',
    badge: { bg: 'rgba(217,119,6,0.15)', color: '#FCD34D', label: '🟡 Warning' },
  },
  positive: {
    bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)', numColor: '#86EFAC',
    badge: { bg: 'rgba(34,197,94,0.12)', color: '#86EFAC', label: '🟢 Positive' },
  },
  info: {
    bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', numColor: '#93C5FD',
    badge: { bg: 'rgba(59,130,246,0.12)', color: '#93C5FD', label: '🔵 Insight' },
  },
  model: {
    bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.15)', numColor: '#C4B5FD',
    badge: { bg: 'rgba(124,58,237,0.12)', color: '#C4B5FD', label: '🟣 ML Finding' },
  },
};

const TIMEFRAME_COLORS: Record<string, string> = {
  'This week':    '#EF4444',
  'This month':   '#F59E0B',
  'This quarter': '#3B82F6',
};

const CONFIDENCE_COLORS: Record<string, { bg: string; text: string }> = {
  high:   { bg: 'rgba(34,197,94,0.12)',   text: '#86EFAC' },
  medium: { bg: 'rgba(245,158,11,0.12)',  text: '#FCD34D' },
  low:    { bg: 'rgba(239,68,68,0.12)',   text: '#FCA5A5' },
};

// ─── Sub-components ───────────────────────────────────────────────────────

const SectionLabel: React.FC<{ act: string; title: string }> = ({ act, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
    <span style={{
      fontSize: 9, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase',
      letterSpacing: '1px', color: '#334155', padding: '3px 8px',
      background: 'rgba(255,255,255,0.04)', borderRadius: 4,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {act}
    </span>
    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
  </div>
);

const FindingCard: React.FC<{ finding: KeyFinding; index: number }> = ({ finding, index }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = WEIGHT_STYLES[finding.weight] ?? WEIGHT_STYLES.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25 }}
      style={{
        background: styles.bg, border: `1px solid ${styles.border}`,
        borderRadius: 10, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Badge */}
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
          background: styles.badge.bg, color: styles.badge.color,
          whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1,
        }}>
          {styles.badge.label}
        </span>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
            {finding.finding}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: styles.numColor, fontFamily: 'monospace' }}>
              {finding.number}
            </span>
            {finding.context && (
              <span style={{ fontSize: 11, color: '#475569' }}>{finding.context}</span>
            )}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ fontSize: 12, color: '#64748B', marginTop: 8, lineHeight: 1.7, overflow: 'hidden' }}
              >
                {finding.plain_english}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <span style={{ fontSize: 10, color: '#1E293B', flexShrink: 0, marginTop: 2 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>
    </motion.div>
  );
};

const ActionCard: React.FC<{ action: ReportAction; index: number }> = ({ action, index }) => {
  const tfColor = TIMEFRAME_COLORS[action.timeframe] ?? '#3B82F6';
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '11px 14px', marginBottom: 7,
        background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
      }}
    >
      {/* Priority badge */}
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0, marginTop: 1,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'monospace',
      }}>
        {action.priority}
      </div>

      <div style={{ flex: 1 }}>
        {/* Timeframe chip */}
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, marginBottom: 6,
          background: `${tfColor}1A`, color: tfColor, display: 'inline-block',
        }}>
          {action.timeframe}
        </span>
        <p style={{ fontSize: 13, color: '#CBD5E1', margin: '4px 0 4px', lineHeight: 1.55 }}>
          {action.action}
        </p>
        {action.expected_impact && (
          <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
            → {action.expected_impact}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────

interface Props {
  report: NarratorReport;
  suggestedPrompts?: string[];
  onSuggestedPrompt?: (prompt: string) => void;
}

export const AnalysisReport: React.FC<Props> = ({ report, suggestedPrompts = [], onSuggestedPrompt }) => {
  const [lessonOpen, setLessonOpen] = useState(false);
  const confidenceStyle = CONFIDENCE_COLORS[report.confidence] ?? CONFIDENCE_COLORS.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        background: 'rgba(8,15,28,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, padding: '20px 22px', marginTop: 8,
      }}
    >
      {/* Report header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 18 }}>📖</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>Analysis Report</div>
          <div style={{ fontSize: 10, color: '#334155' }}>Narrator Analyst · Storytelling format</div>
        </div>
        {/* Confidence badge */}
        <div style={{
          marginLeft: 'auto', padding: '4px 10px', borderRadius: 6,
          background: confidenceStyle.bg,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: confidenceStyle.text, textTransform: 'capitalize' }}>
            {report.confidence} confidence
          </span>
        </div>
      </div>

      {/* ACT 1 — THE QUESTION */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel act="Act 1" title="The Question" />
        <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.75, margin: 0 }}>
          {report.question}
        </p>
      </div>

      {/* ACT 2 — THE DATA */}
      {report.data_summary && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel act="Act 2" title="The Data" />
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.75, margin: 0 }}>
            {report.data_summary}
          </p>
        </div>
      )}

      {/* ACT 3 — THE METHOD */}
      {report.method_summary && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel act="Act 3" title="The Method" />
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.75, margin: 0 }}>
            {report.method_summary}
          </p>
        </div>
      )}

      {/* ACT 4 — THE FINDINGS */}
      {report.key_findings?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel act="Act 4" title="Key Findings" />
          {report.key_findings.map((f, i) => (
            <FindingCard key={i} finding={f} index={i} />
          ))}
        </div>
      )}

      {/* ACT 5 — THE ACTIONS */}
      {report.actions?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel act="Act 5" title="Actions" />
          {report.actions.map((a, i) => (
            <ActionCard key={i} action={a} index={i} />
          ))}
        </div>
      )}

      {/* ACT 6 — LESSONS LEARNED */}
      {(report.lessons_learned?.length > 0 || report.next_questions?.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setLessonOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '6px 0', marginBottom: 8,
            }}
          >
            <SectionLabel act="Act 6" title="Lessons & Next Steps" />
            <span style={{ fontSize: 10, color: '#334155', marginLeft: 4 }}>{lessonOpen ? '▲' : '▼'}</span>
          </button>

          <AnimatePresence>
            {lessonOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}
              >
                {report.lessons_learned?.map((lesson, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#22C55E', fontSize: 11 }}>→</span>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.65 }}>{lesson}</p>
                  </div>
                ))}
                {report.next_questions?.map((q, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, marginTop: 4,
                    padding: '6px 10px', borderRadius: 6,
                    background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)',
                    marginBottom: 4,
                  }}>
                    <span style={{ color: '#3B82F6', fontSize: 11, flexShrink: 0, marginTop: 1 }}>?</span>
                    <p style={{ fontSize: 12, color: '#60A5FA', margin: 0, lineHeight: 1.55 }}>{q}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Confidence reason */}
      {report.confidence_reason && (
        <div style={{
          marginTop: 12, padding: '8px 12px', borderRadius: 7,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: 10, color: '#334155' }}>
            <strong style={{ color: '#475569' }}>Confidence note:</strong> {report.confidence_reason}
          </span>
        </div>
      )}

      {/* Suggested prompts */}
      {suggestedPrompts.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
            What to investigate next →
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {suggestedPrompts.map((p, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onSuggestedPrompt?.(p)}
                style={{
                  background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.18)',
                  borderRadius: 8, padding: '8px 12px',
                  cursor: onSuggestedPrompt ? 'pointer' : 'default',
                  textAlign: 'left', fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
                whileHover={onSuggestedPrompt ? { x: 3, borderColor: 'rgba(37,99,235,0.4)' } : {}}
              >
                <span style={{ fontSize: 12, color: '#60A5FA', lineHeight: 1.5 }}>
                  <span style={{ color: '#334155', marginRight: 6 }}>→</span>
                  {p}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
