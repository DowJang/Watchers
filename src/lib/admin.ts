import { TRIGGER_THRESHOLD } from "./labels";
import { bills, legislators, siteMeta, syncRuns, type SyncRun } from "./repo";
import { gap } from "./site";
import type { Bill } from "./types";

/**
 * 관리자 대시보드가 쓰는 파생 지표.
 *
 * 여기서 계산하는 값은 전부 "빌드 시점의 공식 기록"에서 나온다.
 * 실시간으로 변하는 값(현재 접속자, 오늘 투표수, 신고 댓글 등)은 Supabase 에서 읽으며,
 * 백엔드가 연결되지 않은 동안에는 화면에 "백엔드 미연결"로 표시한다.
 */

export type HealthLevel = "ok" | "warn" | "error";

export interface HealthItem {
  label: string;
  level: HealthLevel;
  value: string;
  hint?: string;
}

export const healthMeta: Record<HealthLevel, { dot: string; color: string; label: string }> = {
  ok: { dot: "●", color: "#1f8a5b", label: "정상" },
  warn: { dot: "●", color: "#b98400", label: "경고" },
  error: { dot: "●", color: "#c0182b", label: "오류" },
};

export function lastRun(): SyncRun | undefined {
  return syncRuns[0];
}

/** 제작서 §18.1 — 시스템 상태 */
export function systemHealth(): HealthItem[] {
  const run = lastRun();
  const errors = run?.entries.filter((e) => e.level === "error") ?? [];
  const warns = run?.entries.filter((e) => e.level === "warn") ?? [];

  const syncLevel: HealthLevel = !run
    ? "warn"
    : run.status === "failed" || errors.length > 0
      ? "error"
      : run.status === "skipped" || run.status === "empty" || warns.length > 0
        ? "warn"
        : "ok";

  return [
    {
      label: "공식 데이터 동기화",
      level: syncLevel,
      value: run ? runStatusLabel(run.status) : "이력 없음",
      hint: run
        ? `${run.startedAt.slice(0, 16).replace("T", " ")} · 오류 ${errors.length} / 경고 ${warns.length}`
        : "아직 한 번도 실행되지 않았습니다. Actions 의 '공식 데이터 동기화' 를 수동 실행해 보세요.",
    },
    {
      label: "데이터 출처",
      level: siteMeta.dataOrigin === "OFFICIAL" ? "ok" : "warn",
      value: siteMeta.dataOrigin === "OFFICIAL" ? "공식 기록" : "예시 데이터",
      hint:
        siteMeta.dataOrigin === "OFFICIAL"
          ? `법안 ${bills.length}건 / 의원 ${legislators.length}명`
          : "ASSEMBLY_API_KEY 를 저장소 Secrets 에 등록하면 공식 기록으로 전환됩니다.",
    },
    {
      label: "헌법재판소 결정",
      level: "ok",
      value: `${bills.filter((b) => b.fact.courtStatus !== "NONE").length}건`,
      hint: "위헌 여부는 헌재의 공식 결정만 표시합니다. 감시자들 자체의 판단·등급은 없습니다.",
    },
    {
      label: "표결 기록",
      level: "ok",
      value: `${bills.filter((b) => b.fact.vote).length}건`,
      hint: `불참 추정 ${bills.filter((b) => b.fact.voteAbsentInferred).length}건`,
    },
  ];
}

function runStatusLabel(status: SyncRun["status"]): string {
  return { ok: "정상", empty: "수집 0건", skipped: "건너뜀(키 없음)", failed: "실패" }[status];
}

/** 제작서 §18.2 — 오늘의 공식 데이터 변경 */
export function todayChanges(): Array<{ label: string; value: number; href: string }> {
  const t = siteMeta.today;
  return [
    { label: "신규 발의", value: t.newBills, href: "/bills/?sort=recent" },
    { label: "위원회 통과", value: t.committeePassed, href: "/bills/?status=COMMITTEE_PASSED" },
    { label: "본회의 가결", value: t.plenaryPassed, href: "/bills/?status=PLENARY_PASSED" },
    { label: "공포", value: t.promulgated, href: "/bills/?status=PROMULGATED" },
    { label: "시행 시작", value: t.inForce, href: "/bills/?status=IN_FORCE" },
    { label: "헌재 결정", value: t.courtDecisions, href: "/bills" },
  ];
}

export interface VoteBoardRow {
  bill: Bill;
  unfit: number;
  fit: number;
  diff: number;
  /** Trigger 도달률 (0~100+) */
  triggerPct: number;
  triggered: boolean;
  remaining: number;
}

/** 제작서 §18.4 / §19 — 투표 현황 및 Trigger Monitor */
export function voteBoard(): VoteBoardRow[] {
  return bills
    .map((b) => {
      const diff = gap(b);
      return {
        bill: b,
        unfit: b.opinion.unfit,
        fit: b.opinion.fit,
        diff,
        triggerPct: Math.round((Math.max(0, diff) / TRIGGER_THRESHOLD) * 100),
        triggered: Boolean(b.opinion.triggeredAt),
        remaining: Math.max(0, TRIGGER_THRESHOLD - diff),
      };
    })
    .sort((a, b) => b.diff - a.diff);
}

/** 제작서 §34 — 관리자 메인 KPI 중 공식 기록에서 바로 계산되는 항목 */
export function factKpis() {
  const board = voteBoard();
  return {
    lastSyncedAt: siteMeta.lastSyncedAt,
    totalBills: bills.length,
    courtRuled: bills.filter((b) => b.fact.courtStatus !== "NONE").length,
    unconstitutional: bills.filter((b) => b.fact.courtStatus === "UNCONSTITUTIONAL").length,
    triggered: board.filter((r) => r.triggered).length,
    nearTrigger: board.filter((r) => !r.triggered && r.diff > 0 && r.remaining <= 200).length,
  };
}

/** 제작서 §21 — 헌재 제출 검토 상태 */
export const reviewStages = [
  "Trigger 발생",
  "검토자료 생성",
  "법률검토 필요",
  "청구인 요건 확인 필요",
  "청구 가능",
  "청구 불가능",
  "전자접수 준비",
  "제출 완료",
  "사건번호 확인",
  "심리 중",
  "결정",
] as const;

export type ReviewStage = (typeof reviewStages)[number];
