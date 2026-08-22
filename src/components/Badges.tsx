import type { BillStatus, CourtStatus, OfficialSource } from "@/lib/types";
import { courtLabel, statusLabel } from "@/lib/labels";

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

/**
 * 법적 상태(헌재 판단) 배지.
 * 이 사이트가 표시하는 유일한 "위헌 여부" 신호 — 감시자들이 매긴 등급이 아니라
 * 헌법재판소의 공식 결정을 그대로 옮긴 것이다.
 */
const courtColor: Record<CourtStatus, string> = {
  UNCONSTITUTIONAL: "var(--color-lv-void)",
  NONCONFORMING: "var(--color-lv-incompat)",
  LIMITED_UNCONSTITUTIONAL: "var(--color-lv-incompat)",
  PENDING: "var(--color-lv-medium)",
  CONSTITUTIONAL: "#1f8a5b",
  NONE: "var(--text-3)",
};

export function CourtPill({
  status,
  size = "sm",
}: {
  status: CourtStatus;
  size?: "sm" | "md";
}) {
  // 정적 JSON 에서 오는 값이라 타입 체크를 우회한다 — 값이 비었거나 알 수 없으면
  // "판단 없음"으로 안전하게 대체한다 (빈 배지로 깨지지 않도록).
  const safeStatus: CourtStatus = status in courtLabel ? status : "NONE";
  const color = courtColor[safeStatus];
  const notable = safeStatus !== "NONE";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${
        size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-1 text-xs"
      }`}
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        background: notable ? `color-mix(in srgb, ${color} 10%, transparent)` : "transparent",
      }}
    >
      {notable ? (
        <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: color }} />
      ) : null}
      {courtLabel[safeStatus]}
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
