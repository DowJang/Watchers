/**
 * 데이터 접근 계층.
 *
 * 화면은 이 파일만 본다. 실제 출처가 무엇인지는 여기서 결정한다.
 *
 *   scripts/sync.mjs 가 채운 src/data/official/*.json 에 법안이 있으면 → 공식 기록(OFFICIAL)
 *   비어 있으면(= 인증키 미설정)                                     → 예시 데이터(SAMPLE)
 *
 * 정적 사이트이므로 이 판정은 빌드 시각에 한 번 일어난다.
 */

import officialBills from "@/data/official/bills.json";
import officialPeople from "@/data/official/legislators.json";
import officialMeta from "@/data/official/meta.json";
import syncLogJson from "@/data/official/sync-log.json";

import { bills as sampleBills } from "@/data/bills";
import { legislators as sampleLegislators, parties as sampleParties } from "@/data/people";

import type {
  Bill,
  BillAnalysis,
  CitizenVoteTally,
  DataOrigin,
  Legislator,
  Party,
  SiteMeta,
} from "./types";

/* ────────────────────────────────────────────────────────────
   출처 판정
   ──────────────────────────────────────────────────────────── */

const officialList = (officialBills.bills ?? []) as unknown as Bill[];
const hasOfficial = officialList.length > 0;

export const dataOrigin: DataOrigin = hasOfficial ? "OFFICIAL" : "SAMPLE";

/** 공식 수집분에는 시민 투표 집계가 아직 없다. 0으로 시작한다. */
const emptyTally = (): CitizenVoteTally => ({ unfit: 0, fit: 0, updatedAt: "" });

export const bills: Bill[] = hasOfficial
  ? officialList.map((b) => ({ ...b, opinion: b.opinion ?? emptyTally() }))
  : sampleBills;

export const legislators: Legislator[] = hasOfficial
  ? ((officialPeople.legislators ?? []) as unknown as Legislator[])
  : sampleLegislators;

export const parties: Party[] = hasOfficial
  ? ((officialPeople.parties ?? []) as unknown as Party[])
  : sampleParties;

/* ────────────────────────────────────────────────────────────
   사이트 메타 (제작서 §24 공식자료 최종 확인 / §25 오늘의 변경)
   ──────────────────────────────────────────────────────────── */

/** 예시 데이터로 동작할 때 쓰는 기준 시각·변경 건수 */
const sampleMeta = {
  lastSyncedAt: "2026-08-22T00:00:00+09:00",
  today: { newBills: 2, committeePassed: 1, plenaryPassed: 1, promulgated: 0, inForce: 0, courtDecisions: 0 },
};

export const siteMeta: SiteMeta = {
  lastSyncedAt: hasOfficial ? officialMeta.lastSyncedAt : sampleMeta.lastSyncedAt,
  dataOrigin,
  today: hasOfficial ? officialMeta.today : sampleMeta.today,
};

/** 동기화 이력 — 관리자 화면의 시스템 상태에서 쓴다 (§18.1) */
export type SyncRun = {
  startedAt: string;
  finishedAt: string;
  status: "ok" | "empty" | "skipped" | "failed";
  entries: Array<{ at: string; level: "info" | "warn" | "error"; message: string }>;
};

export const syncRuns: SyncRun[] = (syncLogJson.runs ?? []) as unknown as SyncRun[];

/* ────────────────────────────────────────────────────────────
   조회 헬퍼
   ──────────────────────────────────────────────────────────── */

const billMap = new Map(bills.map((b) => [b.id, b]));
const partyMap = new Map(parties.map((p) => [p.id, p]));
const legislatorMap = new Map(legislators.map((l) => [l.id, l]));

export function getBill(id: string): Bill | undefined {
  return billMap.get(id);
}

export function getParty(id: string): Party {
  return partyMap.get(id) ?? { id, name: "확인 필요", color: "#6b7280" };
}

export function getLegislator(id: string): Legislator | undefined {
  return legislatorMap.get(id);
}

/** 의원 id 목록을 정당별로 묶는다 (§5.5 정당별 총계) */
export function groupByParty(ids: string[]): Array<{ party: Party; members: Legislator[] }> {
  const buckets = new Map<string, Legislator[]>();
  for (const id of ids) {
    const l = legislatorMap.get(id);
    if (!l) continue;
    const arr = buckets.get(l.partyId) ?? [];
    arr.push(l);
    buckets.set(l.partyId, arr);
  }
  return parties
    .filter((p) => buckets.has(p.id))
    .map((p) => ({
      party: p,
      members: (buckets.get(p.id) ?? []).sort((a, b) => a.name.localeCompare(b.name, "ko")),
    }));
}

/* ────────────────────────────────────────────────────────────
   분석 미작성 상태
   ──────────────────────────────────────────────────────────── */

/**
 * 헌법 분석이 아직 없는 법안을 화면에 그릴 때 쓰는 자리표시자.
 * 문구는 전부 "아직 없다"는 사실만 말하고, 내용을 지어내지 않는다.
 */
export const PENDING_ANALYSIS: BillAnalysis = {
  whatItIs: "쉬운 요약을 아직 작성하지 않았습니다. 아래 공식 기록으로 먼저 확인해 주십시오.",
  whyMade: "공식 제안이유를 확인하는 중입니다.",
  coreIssue: "헌법쟁점 검토가 아직 끝나지 않아 충돌등급을 부여하지 않았습니다.",
  keywords: [],
  conflictLevel: "PENDING",
  articleIds: [],
  principleIds: [],
  argumentsAgainst: [],
  argumentsFor: [],
  cases: [],
  reviewedAt: "",
};

/** 분석이 없으면 자리표시자를 돌려준다. 화면은 항상 이 함수를 거친다. */
export function analysisOf(bill: Bill): BillAnalysis {
  return bill.analysis ?? PENDING_ANALYSIS;
}

export function isAnalysisPending(bill: Bill): boolean {
  return bill.analysis === null;
}
