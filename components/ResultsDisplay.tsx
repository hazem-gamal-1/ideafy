'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Scale, BarChart2, BrainCircuit,
  AlertTriangle, TrendingUp, TrendingDown, Compass,
  ShieldAlert, Milestone, ArrowLeft, CheckCircle2,
  Terminal, Diamond, Sparkles, ChevronDown,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface IdeaValidation {
  market_score: number | null;
  competition_score: number | null;
  risks: string[];
  summary: string;
}
interface LegalAnalysis {
  legal_risks: string[];
  recommended_steps: string[];
  summary: string;
}
interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  scenarios: string[];
  summary: string;
}
interface ParsedResults {
  idea_validation: IdeaValidation | null;
  legal_analysis: LegalAnalysis | null;
  swot_analysis: SwotAnalysis | null;
  overall_summary: string;
}
interface ResultsDisplayProps {
  results: any;
  streamLog: Array<any>;
  onReset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSER
// ─────────────────────────────────────────────────────────────────────────────

function flattenToString(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flattenToString).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenToString).join(' ');
  return String(value);
}
function extractList(text: string, key: string): string[] {
  const m = text.match(new RegExp(`${key}=\\[([^\\]]*?)\\]`));
  if (!m) return [];
  return m[1].split(/,\s*/).map(s => s.replace(/^['"\s]+|['"\s]+$/g, '').trim()).filter(Boolean);
}
function extractFloat(text: string, key: string): number | null {
  const m = text.match(new RegExp(`${key}=([\\d.]+)`));
  return m ? parseFloat(m[1]) : null;
}
function parseResults(results: any): ParsedResults {
  if (results && typeof results === 'object' && !Array.isArray(results) &&
    results.idea_validation && typeof results.idea_validation === 'object' && !Array.isArray(results.idea_validation)) {
    const iv = results.idea_validation; const la = results.legal_analysis ?? {}; const sw = results.swot_analysis ?? {};
    return {
      idea_validation: { market_score: iv.market_score ?? null, competition_score: iv.competition_score ?? null, risks: Array.isArray(iv.risks) ? iv.risks : [], summary: iv.summary ?? '' },
      legal_analysis: { legal_risks: Array.isArray(la.legal_risks) ? la.legal_risks : [], recommended_steps: Array.isArray(la.recommended_steps) ? la.recommended_steps : [], summary: la.summary ?? '' },
      swot_analysis: { strengths: Array.isArray(sw.strengths) ? sw.strengths : [], weaknesses: Array.isArray(sw.weaknesses) ? sw.weaknesses : [], opportunities: Array.isArray(sw.opportunities) ? sw.opportunities : [], threats: Array.isArray(sw.threats) ? sw.threats : [], scenarios: Array.isArray(sw.scenarios) ? sw.scenarios : [], summary: sw.summary ?? '' },
      overall_summary: typeof results.overall_summary === 'string' ? results.overall_summary : flattenToString(results.overall_summary),
    };
  }
  const raw = flattenToString(results);
  if (!raw) return { idea_validation: null, legal_analysis: null, swot_analysis: null, overall_summary: '' };
  const summaryRe = /summary='((?:[^'\\]|\\.)*)'/g;
  const summaries: string[] = [];
  let sm: RegExpExecArray | null;
  while ((sm = summaryRe.exec(raw)) !== null) summaries.push(sm[1].trim());
  const overallMatch = raw.match(/overall_summary='((?:[^'\\]|\\.)*)'/);
  const iv: IdeaValidation = { market_score: extractFloat(raw, 'market_score'), competition_score: extractFloat(raw, 'competition_score'), risks: extractList(raw, 'risks'), summary: summaries[0] ?? '' };
  const la: LegalAnalysis = { legal_risks: extractList(raw, 'legal_risks'), recommended_steps: extractList(raw, 'recommended_steps'), summary: summaries[1] ?? '' };
  const sw: SwotAnalysis = { strengths: extractList(raw, 'strengths'), weaknesses: extractList(raw, 'weaknesses'), opportunities: extractList(raw, 'opportunities'), threats: extractList(raw, 'threats'), scenarios: extractList(raw, 'scenarios'), summary: summaries[2] ?? '' };
  const hasData = iv.market_score !== null || iv.risks.length > 0 || la.legal_risks.length > 0 || sw.strengths.length > 0;
  return { idea_validation: hasData ? iv : null, legal_analysis: hasData ? la : null, swot_analysis: hasData ? sw : null, overall_summary: overallMatch?.[1] ?? '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } }),
};
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const tagVariant = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'backOut' } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] } }),
};

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING — animated SVG arc
// ─────────────────────────────────────────────────────────────────────────────

function ScoreRing({ score, max = 10, color, trackColor, label, delay = 0 }: {
  score: number; max?: number; color: string; trackColor: string; label: string; delay?: number;
}) {
  const r = 28; const circ = 2 * Math.PI * r;
  const pct = score / max;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: 'backOut' }}
    >
      <div className="relative w-[72px] h-[72px] flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke={trackColor} strokeWidth="5" />
          <motion.circle
            cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: pct }}
            transition={{ duration: 1.4, delay: delay + 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ pathLength: pct }}
            strokeDasharray={`${circ}`}
          />
        </svg>
        <motion.div
          className="flex flex-col items-center leading-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.4 }}
        >
          <span className="text-xl font-black text-foreground">{score}</span>
          <span className="text-[9px] text-muted-foreground/40 font-semibold tracking-wide">/10</span>
        </motion.div>
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">{label}</span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAG
// ─────────────────────────────────────────────────────────────────────────────

const TAG_CONFIG: Record<string, { cls: string; Icon: React.ElementType }> = {
  risk:        { cls: 'bg-red-500/10 text-red-400 border-red-500/25',             Icon: AlertTriangle },
  strength:    { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', Icon: TrendingUp    },
  weakness:    { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/25',    Icon: TrendingDown  },
  opportunity: { cls: 'bg-sky-500/10 text-sky-400 border-sky-500/25',             Icon: Compass       },
  threat:      { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/25',          Icon: ShieldAlert   },
  scenario:    { cls: 'bg-violet-500/10 text-violet-400 border-violet-500/25',    Icon: Milestone     },
  default:     { cls: 'bg-muted/40 text-muted-foreground border-border/30',       Icon: Diamond       },
};

function Tag({ children, variant = 'default' }: { children: React.ReactNode; variant?: keyof typeof TAG_CONFIG }) {
  const { cls, Icon } = TAG_CONFIG[variant] ?? TAG_CONFIG.default;
  return (
    <motion.span
      variants={tagVariant}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-xs font-medium ${cls}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Icon size={10} strokeWidth={2.5} />
      {children}
    </motion.span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL + DIVIDER
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50 mb-3">{children}</p>;
}
function Divider() {
  return <motion.div className="h-px bg-border/20 my-5" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ transformOrigin: 'left' }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD SHELL
// ─────────────────────────────────────────────────────────────────────────────

function Card({ icon, title, accentFrom, accentTo, children, index = 0 }: {
  icon: React.ReactNode; title: string; accentFrom: string; accentTo: string;
  children: React.ReactNode; index?: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      initial="hidden"
      animate="show"
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-card/60 backdrop-blur-sm shadow-xl shadow-black/10"
      whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
    >
      {/* Gradient top bar */}
      <div className={`h-[2px] w-full bg-gradient-to-r ${accentFrom} ${accentTo} flex-shrink-0`} />

      {/* Glow on hover */}
      <div className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${accentFrom}/[0.03] ${accentTo}/[0.01]`} />

      <div className="relative flex flex-col flex-1 p-6 gap-0">
        {/* Card header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accentFrom}/20 ${accentTo}/10 border border-white/[0.07]`}>
            {icon}
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-wide">{title}</h3>
        </div>
        <div className="text-sm flex-1">{children}</div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IDEA VALIDATION CARD
// ─────────────────────────────────────────────────────────────────────────────

function IdeaValidationCard({ data, index }: { data: IdeaValidation; index: number }) {
  return (
    <Card icon={<Lightbulb size={16} className="text-blue-400" />} title="Idea Validation"
      accentFrom="from-blue-500" accentTo="to-cyan-400" index={index}>

      {(data.market_score !== null || data.competition_score !== null) && (
        <div className="mb-5">
          <SectionLabel>Scores</SectionLabel>
          <div className="flex gap-5">
            {data.market_score !== null && (
              <ScoreRing score={data.market_score} color="#60a5fa" trackColor="rgba(96,165,250,0.1)" label="Market" delay={0.3 + index * 0.1} />
            )}
            {data.competition_score !== null && (
              <ScoreRing score={data.competition_score} color="#22d3ee" trackColor="rgba(34,211,238,0.1)" label="Competition" delay={0.45 + index * 0.1} />
            )}
          </div>
        </div>
      )}

      {data.risks.length > 0 && (
        <>
          <Divider />
          <div className="mb-5">
            <SectionLabel>Key Risks</SectionLabel>
            <motion.div className="flex flex-wrap gap-2" variants={staggerContainer} initial="hidden" animate="show">
              {data.risks.map((r, i) => <Tag key={i} variant="risk">{r}</Tag>)}
            </motion.div>
          </div>
        </>
      )}

      {data.summary && (
        <>
          <Divider />
          <div>
            <SectionLabel>Summary</SectionLabel>
            <p className="text-xs leading-relaxed text-muted-foreground/80">{data.summary}</p>
          </div>
        </>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL CARD
// ─────────────────────────────────────────────────────────────────────────────

function LegalCard({ data, index }: { data: LegalAnalysis; index: number }) {
  return (
    <Card icon={<Scale size={16} className="text-amber-400" />} title="Legal Analysis"
      accentFrom="from-amber-500" accentTo="to-orange-400" index={index}>

      {data.legal_risks.length > 0 && (
        <div className="mb-5">
          <SectionLabel>Legal Risks</SectionLabel>
          <motion.ul className="space-y-2.5" variants={staggerContainer} initial="hidden" animate="show">
            {data.legal_risks.map((r, i) => (
              <motion.li key={i} variants={fadeUp} custom={i} className="flex gap-2.5 text-xs text-muted-foreground/80 leading-relaxed">
                <Diamond size={8} className="mt-[4px] text-amber-400 flex-shrink-0 fill-amber-400/50" />
                {r}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      )}

      {data.recommended_steps.length > 0 && (
        <>
          <Divider />
          <div className="mb-5">
            <SectionLabel>Recommended Steps</SectionLabel>
            <motion.ol className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
              {data.recommended_steps.map((s, i) => (
                <motion.li key={i} variants={fadeUp} custom={i} className="flex gap-3 text-xs text-muted-foreground/80 leading-relaxed">
                  <span className="flex-shrink-0 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-[9px] font-bold border border-amber-500/20 mt-px">
                    {i + 1}
                  </span>
                  {s}
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </>
      )}

      {data.summary && (
        <>
          <Divider />
          <div>
            <SectionLabel>Summary</SectionLabel>
            <p className="text-xs leading-relaxed text-muted-foreground/80">{data.summary}</p>
          </div>
        </>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SWOT CARD
// ─────────────────────────────────────────────────────────────────────────────

function SwotCard({ data, index }: { data: SwotAnalysis; index: number }) {
  const quadrants = [
    { label: 'Strengths',     items: data.strengths,     variant: 'strength'    as const, Icon: TrendingUp,  border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.04]' },
    { label: 'Weaknesses',    items: data.weaknesses,    variant: 'weakness'    as const, Icon: TrendingDown, border: 'border-orange-500/20',  bg: 'bg-orange-500/[0.04]' },
    { label: 'Opportunities', items: data.opportunities, variant: 'opportunity' as const, Icon: Compass,      border: 'border-sky-500/20',     bg: 'bg-sky-500/[0.04]' },
    { label: 'Threats',       items: data.threats,       variant: 'threat'      as const, Icon: ShieldAlert,  border: 'border-rose-500/20',    bg: 'bg-rose-500/[0.04]' },
  ];

  const [showScenarios, setShowScenarios] = useState(false);

  return (
    <Card icon={<BarChart2 size={16} className="text-violet-400" />} title="SWOT Analysis"
      accentFrom="from-violet-500" accentTo="to-pink-500" index={index}>

      <div className="grid grid-cols-2 gap-2">
        {quadrants.map(({ label, items, variant, Icon, border, bg }, qi) => (
          <motion.div
            key={label}
            className={`rounded-xl border ${border} ${bg} p-3 space-y-2`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + qi * 0.07, duration: 0.4, ease: 'easeOut' }}
          >
            <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
              <Icon size={9} strokeWidth={2.5} /> {label}
            </p>
            <motion.div className="flex flex-wrap gap-1.5" variants={staggerContainer} initial="hidden" animate="show">
              {items.length > 0
                ? items.map((item, i) => <Tag key={i} variant={variant}>{item}</Tag>)
                : <span className="text-[10px] text-muted-foreground/25 italic">—</span>
              }
            </motion.div>
          </motion.div>
        ))}
      </div>

      {data.scenarios.length > 0 && (
        <>
          <Divider />
          <button
            onClick={() => setShowScenarios(v => !v)}
            className="flex w-full items-center justify-between text-left group/btn mb-1"
          >
            <SectionLabel>Future Scenarios</SectionLabel>
            <motion.div animate={{ rotate: showScenarios ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown size={13} className="text-muted-foreground/40 group-hover/btn:text-muted-foreground/70 transition-colors -mt-2" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showScenarios && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-2 overflow-hidden"
              >
                {data.scenarios.map((s, i) => (
                  <motion.li key={i} initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.06 }}
                    className="flex gap-2.5 text-xs text-muted-foreground/80 leading-relaxed">
                    <Milestone size={10} className="mt-0.5 text-violet-400 flex-shrink-0" />
                    {s}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          {!showScenarios && (
            <button onClick={() => setShowScenarios(true)} className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
              Show {data.scenarios.length} scenario{data.scenarios.length > 1 ? 's' : ''} →
            </button>
          )}
        </>
      )}

      {data.summary && (
        <>
          <Divider />
          <SectionLabel>Summary</SectionLabel>
          <p className="text-xs leading-relaxed text-muted-foreground/80">{data.summary}</p>
        </>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERALL SUMMARY BANNER
// ─────────────────────────────────────────────────────────────────────────────

function OverallSummaryCard({ text }: { text: string }) {
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 20) ?? [text];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-emerald-950/40 via-card/60 to-teal-950/30 backdrop-blur-sm shadow-xl shadow-black/10"
    >
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 to-teal-400" />

      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-teal-500/5 blur-2xl" />

      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
            <BrainCircuit size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-wide">Overall Summary</h3>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Synthesized analysis across all dimensions</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
            <Sparkles size={10} className="text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400">AI Analysis</span>
          </div>
        </div>

        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {sentences.map((s, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors duration-200"
            >
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 w-1 rounded-full bg-gradient-to-b from-emerald-400/60 to-teal-400/20 mt-0.5" />
                <p className="text-xs leading-relaxed text-muted-foreground/80">{s}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

function RawFallbackCard({ results, streamLog }: { results: any; streamLog: any[] }) {
  const entries = results['_raw'] ? [{ step: 'raw', content: results['_raw'] }] : streamLog;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-2xl border border-white/[0.07] bg-card/60 overflow-hidden">
      <div className="h-[2px] w-full bg-gradient-to-r from-primary to-accent" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50">
            <Terminal size={16} className="text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Stream Output</h3>
        </div>
        <div className="space-y-2 font-mono">
          {entries.map((e, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-lg border border-border/20 bg-muted/20 p-3 text-xs text-muted-foreground">
              <strong className="text-primary/70">[{e.step}]</strong>{' '}
              {typeof e.content === 'string' ? e.content : JSON.stringify(e.content)}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function ResultsDisplay({ results, streamLog, onReset }: ResultsDisplayProps) {
  const parsed = useMemo(() => parseResults(results), [results]);
  const hasStructured = parsed.idea_validation !== null || parsed.legal_analysis !== null || parsed.swot_analysis !== null || !!parsed.overall_summary;

  const cards = [
    parsed.idea_validation && { key: 'idea', el: <IdeaValidationCard data={parsed.idea_validation} index={0} /> },
    parsed.legal_analysis  && { key: 'legal', el: <LegalCard data={parsed.legal_analysis} index={1} /> },
    parsed.swot_analysis   && { key: 'swot', el: <SwotCard data={parsed.swot_analysis} index={2} /> },
  ].filter(Boolean) as { key: string; el: React.ReactNode }[];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3"
      >
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 w-fit"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: 'backOut' }}
        >
          <CheckCircle2 size={12} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Analysis Complete</span>
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <motion.h2
            className="text-4xl font-black tracking-tight text-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Your{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]">
              results
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground/50 pb-1"
          >
            {cards.length} analysis modules completed
          </motion.p>
        </div>
      </motion.div>

      {/* ── Content ── */}
      {hasStructured ? (
        <div className="space-y-5">
          {/* Three-column card grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {cards.map(({ key, el }) => (
              <div key={key} className="flex flex-col min-h-0">{el}</div>
            ))}
          </div>

          {/* Overall summary full-width below */}
          {parsed.overall_summary && (
            <OverallSummaryCard text={parsed.overall_summary} />
          )}
        </div>
      ) : (
        <RawFallbackCard results={results} streamLog={streamLog} />
      )}

      {/* ── Footer Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-5 border-t border-white/[0.06]"
      >
        <motion.button
          onClick={onReset}
          className="group inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-6 py-2.5 text-sm font-semibold text-foreground/80 transition-colors duration-200 hover:bg-muted/60 hover:text-foreground hover:border-border"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
          Start Over
        </motion.button>

        <motion.p
          className="flex items-center gap-2 text-xs text-muted-foreground/50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        >
          <CheckCircle2 size={12} className="text-emerald-400/70" />
          Analysis complete — try another idea whenever you're ready.
        </motion.p>
      </motion.div>

    </div>
  );
}