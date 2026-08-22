import { bills } from "@/data/bills";
import type { Bill, CitizenComment, SiteMeta } from "./types";
import { TRIGGER_THRESHOLD, conflictOrder } from "./labels";

/** 제작서 §38 — 핵심 문구 */
export const SITE = {
  name: "감시자들",
  slogan: "누가, 왜 이 법을 만들었고 헌법과 어디에서 충돌하는가.",
  description: "대한민국 국가기관의 공식 기록만으로 입법과 헌법의 관계를 추적합니다.",
  participation: "공식 기록을 확인한 뒤 직접 판단해 주십시오.",
  voteQuestion: "이 법안이 대한민국 헌법의 원칙에 적합하다고 생각하십니까?",
} as const;

/** 제작서 §24 — 공식자료 최종 확인 시각 / §25 오늘의 변경 */
export const siteMeta: SiteMeta = {
  lastSyncedAt: "2026-08-22T00:00:00+09:00",
  dataOrigin: "SAMPLE",
  today: {
    newBills: 2,
    committeePassed: 1,
    plenaryPassed: 1,
    promulgated: 0,
    inForce: 0,
    courtDecisions: 0,
  },
};

/** 시민 의견투표 격차 (부적합 − 적합) */
export function gap(bill: Bill): number {
  return bill.opinion.unfit - bill.opinion.fit;
}

export function totalVotes(bill: Bill): number {
  return bill.opinion.unfit + bill.opinion.fit;
}

/** Trigger 발동 여부 — 최초 도달 시각이 기록되어 있으면 발동으로 본다 (§14) */
export function isTriggered(bill: Bill): boolean {
  return Boolean(bill.opinion.triggeredAt);
}

/** Trigger 까지 남은 표 수 (§19) */
export function remainingToTrigger(bill: Bill): number {
  return Math.max(0, TRIGGER_THRESHOLD - gap(bill));
}

const levelRank = new Map(conflictOrder.map((l, i) => [l, i]));

/** 충돌등급 높은 순 → 최신 발의 순 */
export function sortByGravity(list: Bill[]): Bill[] {
  return [...list].sort((a, b) => {
    const la = levelRank.get(a.analysis.conflictLevel) ?? 99;
    const lb = levelRank.get(b.analysis.conflictLevel) ?? 99;
    if (la !== lb) return la - lb;
    return b.fact.proposal.proposedAt.localeCompare(a.fact.proposal.proposedAt);
  });
}

export function sortByRecent(list: Bill[]): Bill[] {
  return [...list].sort((a, b) =>
    b.fact.proposal.proposedAt.localeCompare(a.fact.proposal.proposedAt),
  );
}

export function allBills(): Bill[] {
  return bills;
}

/** HOME — 헌법충돌 주요 법안 */
export function keyConflictBills(limit = 3): Bill[] {
  return sortByGravity(
    bills.filter((b) => ["VOID", "INCOMPATIBLE", "HIGH"].includes(b.analysis.conflictLevel)),
  ).slice(0, limit);
}

/** HOME — 신규 법안 */
export function newBills(limit = 3): Bill[] {
  return sortByRecent(bills).slice(0, limit);
}

/** HOME — 현재 시행 법률 */
export function inForceBills(limit = 3): Bill[] {
  return bills
    .filter((b) => b.fact.status === "IN_FORCE" || b.fact.status === "EFFECTIVE_SCHEDULED")
    .slice(0, limit);
}

/** HOME — 오늘의 시민의견 (부적합 격차가 큰 순 = Trigger에 가까운 순) */
export function topOpinionBills(limit = 3): Bill[] {
  return [...bills].sort((a, b) => gap(b) - gap(a)).slice(0, limit);
}

/** 특정 헌법 조항을 다루는 법안 (§33 CONSTITUTION) */
export function billsByArticle(articleId: string): Bill[] {
  return sortByGravity(bills.filter((b) => b.analysis.articleIds.includes(articleId)));
}

/** 의원별 발의·표결 기록 (§33 LEGISLATORS) */
export function billsByLegislator(legislatorId: string) {
  const sponsored = bills.filter((b) => b.fact.proposal.sponsorId === legislatorId);
  const coSponsored = bills.filter((b) => b.fact.proposal.coSponsorIds.includes(legislatorId));
  const voted = bills
    .map((b) => {
      const v = b.fact.vote;
      if (!v) return null;
      const choice = v.for.includes(legislatorId)
        ? ("FOR" as const)
        : v.against.includes(legislatorId)
          ? ("AGAINST" as const)
          : v.abstain.includes(legislatorId)
            ? ("ABSTAIN" as const)
            : v.absent.includes(legislatorId)
              ? ("ABSENT" as const)
              : null;
      return choice ? { bill: b, choice } : null;
    })
    .filter((x): x is { bill: Bill; choice: "FOR" | "AGAINST" | "ABSTAIN" | "ABSENT" } => x !== null);
  return { sponsored, coSponsored, voted };
}

/**
 * ⚠️ 예시(SAMPLE) 시민 코멘트.
 * 실서비스에서는 인증된 사용자의 실제 코멘트를 DB에서 읽는다 (§15).
 */
export const sampleComments: CitizenComment[] = [
  {
    id: "c-1",
    billId: "judicial-misapplication",
    handle: "시민 4f2a",
    body: "처벌범위가 너무 추상적이라고 생각합니다. 어떤 판단까지 처벌되는지 일반인이 예측하기 어렵습니다.",
    vote: "UNFIT",
    createdAt: "2026-08-21T09:12:00+09:00",
    status: "VISIBLE",
  },
  {
    id: "c-2",
    billId: "judicial-misapplication",
    handle: "시민 91cd",
    body: "오판에 아무 책임을 묻지 못하는 현실도 문제라고 봅니다. 다만 요건은 더 좁혀야 할 것 같습니다.",
    vote: "FIT",
    createdAt: "2026-08-21T14:40:00+09:00",
    status: "VISIBLE",
  },
  {
    id: "c-3",
    billId: "online-false-info",
    handle: "시민 07be",
    body: "무엇이 허위인지 사업자가 먼저 판단하게 하는 구조가 걱정됩니다.",
    vote: "UNFIT",
    createdAt: "2026-08-20T20:05:00+09:00",
    status: "VISIBLE",
  },
];

export function commentsFor(billId: string): CitizenComment[] {
  return sampleComments.filter((c) => c.billId === billId && c.status === "VISIBLE");
}
