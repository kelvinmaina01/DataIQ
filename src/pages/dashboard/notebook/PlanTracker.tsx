/**
 * DataIQ — Plan Tracker Component
 * Shows all plan steps upfront as PENDING, animates to RUNNING → DONE.
 * Spec Section 4.3 & 6.1
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlanStep } from '../../types/streaming';

const STEP_TYPE_ICONS: Record<string, string> = {
  data_load:        '📥',
  data_clean:       '🧹',
  eda:              '🔍',
  query:            '🔎',
  statistical_test: '📊',
  visualization:    '📈',
  ml_train:         '🤖',
  ml_evaluate:      '📋',
  ml_explain:       '💡',
  insight_extract:  '🧠',
  report:           '📖',
};

const STEP_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', text: '#475569' },
  running: { bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.35)',   text: '#93C5FD' },
  done:    { bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.28)',   text: '#86EFAC' },
  error:   { bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.28)',   text: '#FCA5A5' },
};

function getPlanProgress(plan: PlanStep[]): number {
  if (!plan.length) return 0;
  const done    = plan.filter(s => s.status === 'done' || s.status === 'error').length;
  const running = plan.filter(s => s.status === 'running').length;
  return ((done + running * 0.5) / plan.length) * 100;
}

interface Props {
  plan: PlanStep[];
  currentStep?: number;
}

export const PlanTracker: React.FC<Props> = ({ plan, currentStep }) => {
  if (!plan || plan.length === 0) return null;

  const doneCount = plan.filter(s => s.status === 'done').length;
  const progress  = getPlanProgress(plan);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'rgba(10,18,35,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Implementation Plan
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>
          {doneCount}/{plan.length} steps
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(90deg, #2563EB, #7C3AED)', borderRadius: 2 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Steps */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <AnimatePresence>
          {plan.map((step, i) => {
            const colors    = STEP_COLORS[step.status] ?? STEP_COLORS.pending;
            const isRunning = step.status === 'running';
            const isDone    = step.status === 'done';
            const isError   = step.status === 'error';

            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 8,
                  background: colors.bg, border: `1px solid ${colors.border}`,
                  transition: 'all 0.28s ease',
                }}
              >
                {/* Status indicator */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isRunning ? 'rgba(37,99,235,0.18)'
                    : isDone  ? 'rgba(34,197,94,0.18)'
                    : isError ? 'rgba(239,68,68,0.18)'
                    : 'rgba(255,255,255,0.05)',
                }}>
                  {isRunning ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                      style={{
                        width: 12, height: 12,
                        border: '1.5px solid #2563EB',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                      }}
                    />
                  ) : isDone ? (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#34D399" strokeWidth="2">
                      <path d="M2 6l3 3 5-5"/>
                    </svg>
                  ) : isError ? (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#F87171" strokeWidth="2">
                      <path d="M2 2l8 8M10 2l-8 8"/>
                    </svg>
                  ) : (
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#334155', fontWeight: 700 }}>
                      {String(step.step).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Step type icon */}
                <span style={{ fontSize: 12, flexShrink: 0 }}>
                  {STEP_TYPE_ICONS[step.type] ?? '⚙️'}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: isRunning ? 600 : 500,
                    color: isRunning ? 'white' : isDone ? '#86EFAC' : colors.text,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {step.title}
                  </div>
                  <AnimatePresence>
                    {isRunning && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ fontSize: 10, color: '#60A5FA', marginTop: 1, overflow: 'hidden' }}
                      >
                        {step.description}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Time estimate */}
                <span style={{ fontSize: 9, color: '#1E293B', fontFamily: 'monospace', flexShrink: 0 }}>
                  ~{step.estimated_seconds}s
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
