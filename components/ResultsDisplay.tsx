'use client';

import React from 'react';
import {
  Lightbulb,
  Scale,
  BarChart2,
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Compass,
  ShieldAlert,
  Milestone,
  ArrowLeft,
  CheckCircle2,
  Terminal,
  Diamond,
} from 'lucide-react';

interface ResultsDisplayProps {
  results: any;
  streamLog: Array<any>;
  onReset: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ScoreRing({ score, max = 10, color }: { score: number; max?: number; color: string }) {
  const pct = score / max;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="absolute inset-0 -rotate-90" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="currentColor" strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className={color}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <span className="text-xl font-black text-foreground">{score}</span>
    </div>
  );
}

const TAG_CONFIG: Record<string, { style: string; Icon: React.ElementType }> = {
  risk:        { style: 'bg-red-500/10 text-red-400 border-red-500/20',       Icon: AlertTriangle },
  strength:    { style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', Icon: TrendingUp },
  weakness:    { style: 'bg-orange-500/10 text-orange-400 border-orange-500/20',    Icon: TrendingDown },
  opportunity: { style: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    Icon: Compass },
  threat:      { style: 'bg-red-500/10 text-red-400 border-red-500/20',       Icon: ShieldAlert },
  scenario:    { style: 'bg-purple-500/10 text-purple-400 border-purple-500/20',    Icon: Milestone },
  default:     { style: 'bg-muted/40 text-muted-foreground border-border/30', Icon: Diamond },
};

function Tag({ children, variant = 'default' }: { children: React.ReactNode; variant?: keyof typeof TAG_CONFIG }) {
  const { style, Icon } = TAG_CONFIG[variant] ?? TAG_CONFIG.default;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style}`}>
      <Icon size={11} />
      {children}
    </span>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border/30 my-4" />;
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({
  icon, title, accent, children, wide,
}: {
  icon: React.ReactNode; title: string; accent: string; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card/70 to-card/30 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 ${wide ? 'md:col-span-2' : ''}`}>
      {/* top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
      <div className="p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-xl">{icon}</div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <div className="space-y-5 text-sm">{children}</div>
      </div>
    </div>
  );
}

// ── Idea Validation ───────────────────────────────────────────────────────────

function IdeaValidationCard({ data }: { data: any }) {
  // data may be an array of strings (raw content lines) or an object
  let parsed = data;
  if (Array.isArray(data)) {
    // Try to find the structured_response line
    const structured = data.find((d: string) =>
      typeof d === 'string' && d.includes('market_score')
    );
    if (structured) {
      const ms = structured.match(/market_score=([\d.]+)/);
      const cs = structured.match(/competition_score=([\d.]+)/);
      const risks = structured.match(/risks=\[(.*?)\]/);
      const summary = structured.match(/summary='([^']+)'/);
      parsed = {
        market_score: ms ? parseFloat(ms[1]) : null,
        competition_score: cs ? parseFloat(cs[1]) : null,
        risks: risks ? risks[1].split("', '").map((r: string) => r.replace(/'/g, '')) : [],
        summary: summary ? summary[1] : '',
      };
    }
  }

  const marketScore = parsed?.market_score ?? null;
  const compScore = parsed?.competition_score ?? null;
  const risks: string[] = parsed?.risks ?? [];
  const summary: string = parsed?.summary ?? (typeof parsed === 'string' ? parsed : JSON.stringify(parsed));

  return (
    <Card icon={<Lightbulb size={20} className="text-blue-400" />} title="Idea Validation" accent="from-blue-500 to-cyan-500">
      {(marketScore !== null || compScore !== null) && (
        <>
          <Section label="Scores">
            <div className="flex gap-6">
              {marketScore !== null && (
                <div className="flex flex-col items-center gap-1">
                  <ScoreRing score={marketScore} color="text-blue-400" />
                  <span className="text-[11px] text-muted-foreground">Market</span>
                </div>
              )}
              {compScore !== null && (
                <div className="flex flex-col items-center gap-1">
                  <ScoreRing score={compScore} color="text-cyan-400" />
                  <span className="text-[11px] text-muted-foreground">Competition</span>
                </div>
              )}
            </div>
          </Section>
          <Divider />
        </>
      )}

      {risks.length > 0 && (
        <>
          <Section label="Key Risks">
            <div className="flex flex-wrap gap-2">
              {risks.map((r, i) => <Tag key={i} variant="risk">{r}</Tag>)}
            </div>
          </Section>
          <Divider />
        </>
      )}

      {summary && (
        <Section label="Summary">
          <p className="leading-relaxed text-muted-foreground/90">{summary}</p>
        </Section>
      )}
    </Card>
  );
}

// ── Legal Analysis ────────────────────────────────────────────────────────────

function LegalCard({ data }: { data: any }) {
  let legalRisks: string[] = [];
  let steps: string[] = [];
  let summary = '';

  if (Array.isArray(data)) {
    const raw = data.join(' ');
    const lr = raw.match(/legal_risks=\[(.*?)\]/);
    const rs = raw.match(/recommended_steps=\[(.*?)\]/);
    const sm = raw.match(/summary='([^']+)'/);
    legalRisks = lr ? lr[1].split("', '").map((s: string) => s.replace(/'/g, '')) : [];
    steps = rs ? rs[1].split("', '").map((s: string) => s.replace(/'/g, '')) : [];
    summary = sm ? sm[1] : '';
  } else if (typeof data === 'object') {
    legalRisks = data.legal_risks ?? [];
    steps = data.recommended_steps ?? [];
    summary = data.summary ?? '';
  } else {
    summary = String(data);
  }

  return (
    <Card icon={<Scale size={20} className="text-amber-400" />} title="Legal Analysis" accent="from-amber-500 to-orange-500">
      {legalRisks.length > 0 && (
        <>
          <Section label="Legal Risks">
            <ul className="space-y-2">
              {legalRisks.map((r, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground/90 leading-relaxed">
                  <Diamond size={10} className="mt-1 text-orange-400 flex-shrink-0 fill-orange-400" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>
          <Divider />
        </>
      )}

      {steps.length > 0 && (
        <>
          <Section label="Recommended Steps">
            <ol className="space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-muted-foreground/90 leading-relaxed">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </Section>
          <Divider />
        </>
      )}

      {summary && (
        <Section label="Summary">
          <p className="leading-relaxed text-muted-foreground/90">{summary}</p>
        </Section>
      )}
    </Card>
  );
}

// ── SWOT Analysis ─────────────────────────────────────────────────────────────

function SwotCard({ data }: { data: any }) {
  let strengths: string[] = [], weaknesses: string[] = [], opportunities: string[] = [];
  let threats: string[] = [], scenarios: string[] = [], summary = '';

  if (Array.isArray(data)) {
    const raw = data.join(' ');
    const parse = (key: string) => {
      const m = raw.match(new RegExp(`${key}=\\[(.*?)\\]`));
      return m ? m[1].split("', '").map((s: string) => s.replace(/'/g, '')) : [];
    };
    const sm = raw.match(/summary='([^']+)'/);
    strengths = parse('strengths'); weaknesses = parse('weaknesses');
    opportunities = parse('opportunities'); threats = parse('threats');
    scenarios = parse('scenarios');
    summary = sm ? sm[1] : '';
  } else if (typeof data === 'object') {
    strengths = data.strengths ?? []; weaknesses = data.weaknesses ?? [];
    opportunities = data.opportunities ?? []; threats = data.threats ?? [];
    scenarios = data.scenarios ?? []; summary = data.summary ?? '';
  }

  const quadrants = [
    { label: 'Strengths',     items: strengths,     variant: 'strength'    as const, Icon: TrendingUp },
    { label: 'Weaknesses',    items: weaknesses,     variant: 'weakness'    as const, Icon: TrendingDown },
    { label: 'Opportunities', items: opportunities,  variant: 'opportunity' as const, Icon: Compass },
    { label: 'Threats',       items: threats,        variant: 'threat'      as const, Icon: ShieldAlert },
  ];

  return (
    <Card icon={<BarChart2 size={20} className="text-purple-400" />} title="SWOT Analysis" accent="from-purple-500 to-pink-500">
      <div className="grid grid-cols-2 gap-3">
        {quadrants.map(({ label, items, variant, Icon }) => (
          <div key={label} className="rounded-xl border border-border/30 bg-muted/20 p-3 space-y-2">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              <Icon size={11} /> {label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, i) => <Tag key={i} variant={variant}>{item}</Tag>)}
            </div>
          </div>
        ))}
      </div>

      {scenarios.length > 0 && (
        <>
          <Divider />
          <Section label="Scenarios">
            <div className="flex flex-wrap gap-2">
              {scenarios.map((s, i) => <Tag key={i} variant="scenario">{s}</Tag>)}
            </div>
          </Section>
        </>
      )}

      {summary && (
        <>
          <Divider />
          <Section label="Summary">
            <p className="leading-relaxed text-muted-foreground/90">{summary}</p>
          </Section>
        </>
      )}
    </Card>
  );
}

// ── Overall Summary ───────────────────────────────────────────────────────────

function OverallSummaryCard({ data }: { data: any }) {
  let text = '';
  if (Array.isArray(data)) text = data.join(' ');
  else if (typeof data === 'string') text = data;
  else text = JSON.stringify(data);

  // Extract the overall_summary value if it's embedded
  const match = text.match(/overall_summary='([^']+)'/);
  if (match) text = match[1];

  // Split into sentences for nicer display
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];

  return (
    <Card icon={<BrainCircuit size={20} className="text-emerald-400" />} title="Overall Summary" accent="from-emerald-500 to-teal-500" wide>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sentences.map((s, i) => (
          <div key={i} className="rounded-xl border border-border/20 bg-muted/20 p-4">
            <p className="leading-relaxed text-muted-foreground/90">{s.trim()}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Fallback raw stream ───────────────────────────────────────────────────────

function RawStreamCard({ results, streamLog }: { results: any; streamLog: any[] }) {
  return (
    <Card icon={<Terminal size={20} className="text-primary" />} title="Stream Output" accent="from-primary to-accent" wide>
      <div className="space-y-2 font-mono">
        {(results['_raw']
          ? [{ step: 'raw', content: results['_raw'] }]
          : streamLog
        ).map((entry, i) => (
          <div key={i} className="rounded-lg border border-border/30 bg-muted/30 p-3 text-xs text-muted-foreground">
            <strong className="text-primary/80">[{entry.step}]</strong>{' '}
            {typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content)}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ResultsDisplay({ results, streamLog, onReset }: ResultsDisplayProps) {
  const cards = [
    { key: 'idea_validation', Component: IdeaValidationCard },
    { key: 'legal_analysis',  Component: LegalCard },
    { key: 'swot_analysis',   Component: SwotCard },
  ];

  const hasStructured = cards.some(({ key }) => results[key]);
  const hasOverall = !!results['overall_summary'];

  return (
    <div className="animate-slideUp space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-block rounded-lg bg-primary/10 px-3 py-1">
          <p className="text-xs font-bold tracking-wider text-primary uppercase">Analysis Complete</p>
        </div>
        <h2 className="text-5xl font-bold tracking-tight text-foreground">
          Your{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            results
          </span>
        </h2>
      </div>

      {hasStructured ? (
        <div className="space-y-6">
          {/* Top row: 3 cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {cards.map(({ key, Component }) =>
              results[key] ? <Component key={key} data={results[key]} /> : null
            )}
          </div>

          {/* Bottom: overall summary full width */}
          {hasOverall && (
            <OverallSummaryCard data={results['overall_summary']} />
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          <RawStreamCard results={results} streamLog={streamLog} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onReset}
          className="group inline-flex items-center justify-center gap-2 rounded-lg border border-border px-8 py-3 font-semibold text-foreground transition-all duration-300 hover:bg-muted hover:border-primary/30"
        >
          <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
          Start Over
        </button>
        <p className="flex items-center gap-2 text-center text-sm text-muted-foreground">
          <CheckCircle2 size={14} className="text-emerald-400" />
          Analysis complete — export or try another idea.
        </p>
      </div>
    </div>
  );
}