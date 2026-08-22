import type { BillStatus, ConflictLevel, CourtStatus, VoteChoice } from "./types";

/** 제작서 §4 — 현재 상태 표기 */
export const statusLabel: Record<BillStatus, string> = {
  PENDING: "계류",
  COMMITTEE_PASSED: "위원회 통과",
  PLENARY_PASSED: "본회의 가결",
  PROMULGATED: "공포",
  EFFECTIVE_SCHEDULED: "시행 예정",
  IN_FORCE: "시행 중",
  DISCARDED: "폐기",
};

/** 목록 필터 순서 */
export const statusOrder: BillStatus[] = [
  "PENDING",
  "COMMITTEE_PASSED",
  "PLENARY_PASSED",
  "PROMULGATED",
  "EFFECTIVE_SCHEDULED",
  "IN_FORCE",
  "DISCARDED",
];

/** 제작서 §7 — 헌법 충돌 표시등급 */
export const conflictMeta: Record<
  ConflictLevel,
  { dot: string; label: string; short: string; cssVar: string; desc: string }
> = {
  VOID: {
    dot: "🔴",
    label: "위헌 확정",
    short: "위헌",
    cssVar: "var(--color-lv-void)",
    desc: "헌법재판소가 위헌으로 결정한 법률입니다.",
  },
  INCOMPATIBLE: {
    dot: "🔵",
    label: "헌법불합치 등",
    short: "불합치",
    cssVar: "var(--color-lv-incompat)",
    desc: "헌법재판소가 위헌성을 인정했으나 즉시 효력상실과는 다른 결정을 한 경우입니다.",
  },
  HIGH: {
    dot: "🟠",
    label: "헌법 직접충돌 검토 HIGH",
    short: "HIGH",
    cssVar: "var(--color-lv-high)",
    desc: "헌법 조항과 직접 충돌할 소지가 크다고 감시자들이 검토한 법안입니다.",
  },
  MEDIUM: {
    dot: "🟡",
    label: "중대한 헌법쟁점 MEDIUM",
    short: "MEDIUM",
    cssVar: "var(--color-lv-medium)",
    desc: "중대한 헌법쟁점이 있다고 감시자들이 검토한 법안입니다.",
  },
  LOW: {
    dot: "⚪",
    label: "헌법쟁점 LOW",
    short: "LOW",
    cssVar: "var(--color-lv-low)",
    desc: "헌법쟁점이 있으나 충돌 소지가 낮다고 감시자들이 검토한 법안입니다.",
  },
  PENDING: {
    dot: "⚫",
    label: "헌법 분석 준비 중",
    short: "분석 대기",
    cssVar: "var(--text-3)",
    desc: "공식 기록은 수집했으나 헌법 분석이 아직 작성되지 않았습니다. 등급을 자동으로 매기지 않습니다.",
  },
};

export const conflictOrder: ConflictLevel[] = [
  "VOID",
  "INCOMPATIBLE",
  "HIGH",
  "MEDIUM",
  "LOW",
  "PENDING",
];

/** 헌재 판단 전에는 반드시 함께 표시한다 (제작서 §7) */
export const NOT_CONFIRMED_NOTICE = "헌법재판소에 의해 위헌으로 확정된 법률은 아닙니다.";

export function needsNotConfirmedNotice(level: ConflictLevel, court: CourtStatus): boolean {
  if (court === "UNCONSTITUTIONAL") return false;
  if (level === "PENDING") return false; // 등급 자체를 부여하지 않은 상태
  return level === "HIGH" || level === "MEDIUM" || level === "LOW" || court === "NONE";
}

/** 제작서 §4 — 법적 상태 */
export const courtLabel: Record<CourtStatus, string> = {
  NONE: "헌재 판단 없음",
  PENDING: "헌재 심리 중",
  CONSTITUTIONAL: "합헌",
  UNCONSTITUTIONAL: "위헌",
  NONCONFORMING: "헌법불합치",
  LIMITED_UNCONSTITUTIONAL: "한정위헌",
};

/** 제작서 §5.5 — 표결 4분류. 불참은 반대로 계산하지 않는다. */
export const voteMeta: Record<VoteChoice, { label: string; color: string; note?: string }> = {
  FOR: { label: "찬성", color: "#1f8a5b" },
  AGAINST: { label: "반대", color: "#c0392b" },
  ABSTAIN: { label: "기권", color: "#b98400" },
  ABSENT: { label: "불참", color: "#6b7280", note: "불참은 반대로 계산하지 않습니다." },
};

export const voteOrder: VoteChoice[] = ["FOR", "AGAINST", "ABSTAIN", "ABSENT"];

/** 제작서 §10 — 1,000표 격차 Trigger 기준 */
export const TRIGGER_THRESHOLD = 1000;
