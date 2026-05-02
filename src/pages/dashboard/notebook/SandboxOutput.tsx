/**
 * DataIQ — Sandbox Output Component
 * Shows live stdout from the E2B sandbox, including PROGRESS: lines,
 * check messages from the 3-pass checker, and stderr on failure.
 * Spec Section 7.2
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SandboxOutput } from '../../types/streaming';

interface Props {
  stepNum: number;
  output: SandboxOutput;
}

function classifyLine(line: string): { type: 'structured' | 'progress' | 'error' | 'normal'; label?: string; message?: string; pct?: number } {
  if (line.startsWith('CHART_DATA:'))   return { type: 'structured', label: 'chart' };
  if (line.startsWith('STAT_DATA:'))    return { type: 'structured', label: 'stat' };
  if (line.startsWith('INSIGHT_DATA:')) return { type: 'structured', label: 'insight' };
  if (line.startsWith('PROGRESS:')) {
    try {
      const parsed = JSON.parse(line.slice(9));
      return { type: 'progress', message: parsed.message, pct: parsed.pct };
    } catch { return { type: 'progress', message: line.slice(9) }; }
  }
  return { type: 'normal' };
}

export const SandboxOutput: React.FC<Props> = ({ stepNum, output }) => {
  const [open, setOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom as lines arrive
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output.stdout, open]);

  const stdoutLines = output.stdout.split('\n').filter(l => l.trim());
  const stderrLines = output.stderr.split('\n').filter(l => l.trim());
  const checkMessages = output.check_messages ?? [];

  const hasContent = stdoutLines.length > 0 || stderrLines.length > 0 || checkMessages.length > 0;
  if (!hasContent) return null;

  const structuredCount = stdoutLines.filter(l =>
    l.startsWith('CHART_DATA:') || l.startsWith('STAT_DATA:') || l.startsWith('INSIGHT_DATA:')
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#0A0F1A',
        border: `1px solid ${output.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.25)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 6,
        fontSize: 11,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '6px 12px', background: 'transparent', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none',
        }}
      >
        {/* Status dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: output.success ? '#22C55E' : '#EF4444',
          boxShadow: output.success ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(239,68,68,0.5)',
        }} />
        <span style={{ fontFamily: 'monospace', color: '#64748B', fontSize: 10 }}>
          SANDBOX · STEP {stepNum}
        </span>
        <span style={{ color: output.success ? '#34D399' : '#F87171', fontWeight: 600, fontSize: 10 }}>
          {output.success ? '✓ Success' : '✗ Error'}
        </span>
        {structuredCount > 0 && (
          <span style={{ fontSize: 9, color: '#3B82F6', marginLeft: 4 }}>
            {structuredCount} output{structuredCount > 1 ? 's' : ''} captured
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: '#334155', fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 12px' }}>
              {/* Check messages from 3-pass checker */}
              {checkMessages.length > 0 && (
                <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {checkMessages.map((msg, i) => {
                    const isOk  = msg.startsWith('✓');
                    const isWarn = msg.startsWith('⚠');
                    const isFix  = msg.startsWith('🔧');
                    const isErr  = msg.startsWith('✗');
                    return (
                      <div key={i} style={{
                        display: 'flex', gap: 6, marginBottom: 2,
                        color: isOk ? '#34D399' : isWarn ? '#FCD34D' : isFix ? '#60A5FA' : isErr ? '#F87171' : '#64748B',
                        fontFamily: 'monospace', fontSize: 10, lineHeight: 1.6,
                      }}>
                        <span style={{ flexShrink: 0 }}>
                          {isOk ? '✓' : isWarn ? '⚠' : isFix ? '🔧' : isErr ? '✗' : '·'}
                        </span>
                        <span>{msg.slice(msg.startsWith('✓') || msg.startsWith('⚠') || msg.startsWith('✗') ? 2 : msg.startsWith('🔧') ? 3 : 0).trim()}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stdout lines */}
              {stdoutLines.map((line, i) => {
                const classified = classifyLine(line);

                if (classified.type === 'structured') {
                  return (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2, opacity: 0.6 }}>
                      <span style={{ color: '#3B82F6', fontFamily: 'monospace', fontSize: 9 }}>
                        [{classified.label?.toUpperCase()}]
                      </span>
                      <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {line.slice(line.indexOf(':') + 1, 60)}…
                      </span>
                    </div>
                  );
                }

                if (classified.type === 'progress') {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 8, height: 8, border: '1px solid #3B82F6', borderTopColor: 'transparent', borderRadius: '50%', flexShrink: 0 }}
                      />
                      <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontSize: 10 }}>
                        {classified.message}
                      </span>
                      {classified.pct !== undefined && (
                        <span style={{ color: '#334155', fontSize: 9, marginLeft: 'auto' }}>
                          {classified.pct}%
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={i} style={{ fontFamily: 'monospace', color: '#94A3B8', fontSize: 10, lineHeight: 1.6, marginBottom: 1 }}>
                    <span style={{ color: '#1E293B', marginRight: 6 }}>›</span>
                    {line}
                  </div>
                );
              })}

              {/* Stderr */}
              {stderrLines.length > 0 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(239,68,68,0.15)' }}>
                  {stderrLines.map((line, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', color: '#F87171', fontSize: 10, lineHeight: 1.6 }}>
                      <span style={{ color: '#7F1D1D', marginRight: 6 }}>!</span>
                      {line}
                    </div>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
