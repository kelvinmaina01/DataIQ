/**
 * DataIQ — Streaming Code Block Component
 * Code streams in character-by-character.
 * Shows a blinking cursor while streaming, syntax highlights when done.
 * Exposes a "Why this code?" panel extracted from # WHY: comments.
 * Spec Section 4.4
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Download } from 'lucide-react';

// ─── Mini syntax highlighter (matches existing approach in NotebookCell) ──

const PY_KEYWORDS = new Set([
  'import','from','as','def','class','return','if','elif','else','for','while',
  'in','try','except','finally','with','lambda','and','or','not','True','False','None',
  'print','raise','pass','break','continue','yield','async','await',
]);
const SQL_KEYWORDS = new Set([
  'select','from','where','group','by','order','having','limit','as','join',
  'left','right','inner','on','case','when','then','else','end','sum','count',
  'avg','min','max','round','distinct','insert','update','delete','create','drop',
]);

function tokenClass(token: string, lang: 'python' | 'sql'): string {
  if (/^\s+$/.test(token)) return '';
  if (/^#.*$/.test(token))  return 'color:#6A9955;font-style:italic';   // comment green
  if (/^--.*$/.test(token)) return 'color:#6A9955;font-style:italic';
  if (/^["'].*["']$/.test(token)) return 'color:#CE9178';               // string orange
  if (/^\d+(\.\d+)?$/.test(token)) return 'color:#B5CEA8';             // number
  if (/^[(){}[\],.:=+\-/*<>!%]+$/.test(token)) return 'color:#569CD6'; // operator blue
  if (lang === 'sql' && SQL_KEYWORDS.has(token.toLowerCase())) return 'color:#C586C0;font-weight:600';
  if (lang === 'python') {
    if (PY_KEYWORDS.has(token)) return 'color:#C586C0;font-weight:600';
    if (/^[A-Z][A-Za-z0-9_]*$/.test(token)) return 'color:#4EC9B0';
    if (/^(pd|np|df|json|plt|sns|re|os|sys|math)$/.test(token)) return 'color:#9CDCFE';
  }
  return 'color:#D4D4D4';
}

function highlightCode(code: string, lang: 'python' | 'sql'): React.ReactNode {
  return code.split('\n').map((line, li) => {
    const tokens = line.split(/([\s]+|#[^\n]*|--[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[(){}[\],.:=+\-/*<>!%]+)/g).filter(Boolean);
    return (
      <div key={li} className="whitespace-pre">
        {tokens.map((tok, ti) => (
          <span key={ti} style={{ ...(tokenClass(tok, lang) ? { cssText: tokenClass(tok, lang) } as any : {}) }
            // cssText hack won't work — use explicit style parsing below
          }>{tok}</span>
        ))}
      </div>
    );
  });
}

// Proper version with style parsing
function renderHighlighted(code: string, lang: 'python' | 'sql'): React.ReactNode {
  return code.split('\n').map((line, li) => {
    const tokens = line.split(/([\s]+|#[^\n]*|--[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[(){}[\],.:=+\-/*<>!%]+)/g).filter(Boolean);
    return (
      <div key={li} className="whitespace-pre">
        {tokens.map((tok, ti) => {
          const cls = tokenClass(tok, lang);
          if (!cls) return <span key={ti}>{tok}</span>;
          const styles: React.CSSProperties = {};
          cls.split(';').filter(Boolean).forEach(rule => {
            const [prop, val] = rule.split(':').map(s => s.trim());
            if (prop === 'color') styles.color = val;
            if (prop === 'font-style') styles.fontStyle = val as any;
            if (prop === 'font-weight') styles.fontWeight = val as any;
          });
          return <span key={ti} style={styles}>{tok}</span>;
        })}
      </div>
    );
  });
}

// ─── WHY: comment extractor ───────────────────────────────────────────────

function extractWhyComments(code: string): string[] {
  return code.split('\n')
    .filter(l => l.trim().startsWith('# WHY:') || l.trim().startsWith('-- WHY:'))
    .map(l => l.replace(/^[#\-\s]+WHY:\s*/i, '').trim())
    .filter(Boolean);
}

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  step: number;
  language: 'python' | 'sql';
  title: string;
  subtitle: string;
  code: string;
  isStreaming: boolean;
}

export const StreamingCodeBlock: React.FC<Props> = ({
  step, language, title, subtitle, code, isStreaming,
}) => {
  const preRef   = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const whyComments = extractWhyComments(code);

  // Auto-scroll while streaming
  useEffect(() => {
    if (isStreaming && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [code, isStreaming]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `step_${step}.${language === 'sql' ? 'sql' : 'py'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        background: '#0D1117',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 8,
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 12px',
        background: 'rgba(255,255,255,0.025)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* macOS dots */}
        <div style={{ display: 'flex', gap: 5, marginRight: 4 }}>
          {['#ff5f56','#ffbd2e','#27c93f'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>

        {/* Lang badge */}
        <span style={{
          fontSize: 9, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase',
          padding: '2px 6px', borderRadius: 4,
          background: language === 'python' ? 'rgba(34,197,94,0.12)' : 'rgba(124,58,237,0.12)',
          color:      language === 'python' ? '#86EFAC' : '#C4B5FD',
        }}>
          {language}
        </span>

        <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>{title}</span>
        {subtitle && (
          <span style={{ fontSize: 10, color: '#475569' }}>· {subtitle}</span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: 10, color: '#3B82F6', fontFamily: 'monospace' }}
            >
              writing...
            </motion.span>
          )}
          <button onClick={download} title="Download" style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '2px 7px', color: '#475569', cursor: 'pointer',
            fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Download size={10} /> Download
          </button>
          <button onClick={copy} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '2px 7px', color: copied ? '#86EFAC' : '#475569',
            cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
          </button>
        </div>
      </div>

      {/* Code */}
      <pre
        ref={preRef}
        style={{
          margin: 0, padding: '12px 14px',
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 12, lineHeight: 1.75, color: '#D4D4D4',
          maxHeight: 420,
          overflowY: isStreaming ? 'scroll' : 'auto',
          overflowX: 'auto',
        }}
      >
        {isStreaming ? (
          <>
            {code}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                display: 'inline-block', width: 6, height: 14,
                background: '#3B82F6', marginLeft: 1, verticalAlign: 'text-bottom',
              }}
            />
          </>
        ) : (
          <code>{renderHighlighted(code, language)}</code>
        )}
      </pre>

      {/* WHY: explainer panel */}
      {!isStreaming && whyComments.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => setWhyOpen(o => !o)}
            style={{
              width: '100%', padding: '7px 14px', background: 'transparent', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: '#475569', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <span>💬</span>
            <span>Why this code does what it does</span>
            <span style={{ marginLeft: 'auto', fontSize: 9 }}>{whyOpen ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence>
            {whyOpen && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                style={{ overflow: 'hidden', background: 'rgba(37,99,235,0.04)' }}
              >
                <div style={{ padding: '4px 14px 12px' }}>
                  {whyComments.map((exp, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: '#3B82F6', fontSize: 11, marginTop: 1, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 12, color: '#64748B', lineHeight: 1.65 }}>{exp}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
