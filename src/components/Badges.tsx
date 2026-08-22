import type { BillStatus, ConflictLevel, CourtStatus, OfficialSource } from "@/lib/types";
import { conflictMeta, courtLabel, statusLabel } from "@/lib/labels";

/** 제작서 §7 — 헌법 충돌 표시등급 배지 */
export function ConflictBadge({
  level,
  full = false,
  size = "md",
}: {
  level: ConflictLevel;
  full?: boolean;
  size?: "sm" | "md";
}) {
  const m = conflictMeta[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${
        size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-1 text-xs"
      }`}
      style={{
        color: m.cssVar,
        borderColor: `color-mix(in srgb, ${m.cssVar} 45%, transparent)`,
        background: `color-mix(in srgb, ${m.cssVar} 10%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="inline-block size-2 rounded-full"
        style={{ background: m.cssVar }}
      />
      {full ? m.label : m.short}
    </span>
  );
}

/** 제작서 §4 — 현재 상태 */
export function StatusPill({ status }: { status: BillStatus }) {
  const strong = status === "IN_FORCE" || status === "PROMULGATED";
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-[0.6875rem] font-bold"
      style={{
        color: strong ? "var(--fact-fg)" : "var(--text-2)",
        borderColor: strong ? "var(--fact-bd)" : "var(--border-strong)",
        background: strong ? "var(--fact-bg)" : "transparent",
      }}
    >
      {statusLabel[status]}
    </span>
  );
}

/** 제작서 §4 — 법적 상태(헌재 판단) */
export function CourtPill({ status }: { status: CourtStatus }) {
  const alarm =
    status === "UNCONSTITUTIONAL" || status === "NONCONFORMING" || status === "LIMITED_UNCONSTITUTIONAL";
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-[0.6875rem] font-bold"
      style={{
        color: alarm ? "var(--color-lv-incompat)" : "var(--text-3)",
        borderColor: alarm ? "color-mix(in srgb, var(--color-lv-incompat) 40%, transparent)" : "var(--border)",
      }}
    >
      {courtLabel[status]}
    </span>
  );
}

export function Keyword({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold"
      style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
    >
      {children}
    </span>
  );
}

/** 제작서 §5.2 — 각 FACT 항목에 붙는 [공식 원문] 버튼 */
export function SourceLink({ source, compact = false }: { source: OfficialSource; compact?: boolean }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.6875rem] font-semibold transition-colors hover:opacity-80"
      style={{ color: "var(--fact-fg)", borderColor: "var(--fact-bd)", background: "var(--fact-bg)" }}
      title={`${source.agency} — ${source.label}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <path d="M14 4h6v6M20 4l-9 9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" />
      </svg>
      {compact ? "원문" : "공식 원문"}
    </a>
  );
}
