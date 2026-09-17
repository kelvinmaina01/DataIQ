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
  pending: { bg: 'rgba(255,255,255,0.4)', border: 'rgba(14,80,246,0.05)', text: '#64748B' },
  running: { bg: 'rgba(37,99,235,0.05)',   border: 'rgba(37,99,235,0.2)',    text: '#1E40AF' },
  done:    { bg: 'rgba(34,197,94,0.04)',   border: 'rgba(34,197,94,0.15)',   text: '#065F46' },
  error:   { bg: 'rgba(239,68,68,0.04)',   border: 'rgba(239,68,68,0.15)',   text: '#991B1B' },
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
        background: 'rgba(239, 246, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(14, 80, 246, 0.15)',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(14, 80, 246, 0.08)',
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
                {/* Status indicator — The "Real Tick Button" */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${isRunning ? '#3B82F6' : isDone ? '#10B981' : isError ? '#EF4444' : 'rgba(14,80,246,0.2)'}`,
                  background: isDone ? '#10B981' : isRunning ? 'rgba(59,130,246,0.1)' : 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isRunning ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
                }}>
                  {isRunning ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }}
                    />
                  ) : isDone ? (
                    <motion.svg
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  ) : isError ? (
                    <span style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>!</span>
                  ) : (
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(14,80,246,0.3)' }} />
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
