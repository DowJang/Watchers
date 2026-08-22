import type { BillStatus, CourtStatus, VoteChoice } from "./types";

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

/**
 * 법적 상태(헌재 판단) 표시.
 * 이 사이트가 표시하는 "위헌 여부"는 이 값 하나뿐이다 — 감시자들 자체의 등급·논거는 없다.
 */
export const courtLabel: Record<CourtStatus, string> = {
  NONE: "헌재 판단 없음",
  PENDING: "헌재 심리 중",
  CONSTITUTIONAL: "합헌",
  UNCONSTITUTIONAL: "위헌",
  NONCONFORMING: "헌법불합치",
  LIMITED_UNCONSTITUTIONAL: "한정위헌",
};

export const courtStatusOrder: CourtStatus[] = [
  "UNCONSTITUTIONAL",
  "NONCONFORMING",
  "LIMITED_UNCONSTITUTIONAL",
  "PENDING",
  "CONSTITUTIONAL",
  "NONE",
];

/** 최종 확정이 아닌 상태에서 함께 표시한다 — 헌재가 아직 확정하지 않았음을 분명히 한다. */
export const NOT_CONFIRMED_NOTICE = "헌법재판소에 의해 위헌으로 확정된 법률은 아닙니다.";

export function needsNotConfirmedNotice(court: CourtStatus): boolean {
  return court !== "UNCONSTITUTIONAL" && court !== "NONE";
}

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
