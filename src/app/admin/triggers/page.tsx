"use client";

import Link from "next/link";
import { Panel, Stat, StatGrid, LiveOnly } from "@/components/admin/ui";
import { voteBoard } from "@/lib/admin";
import { TRIGGER_THRESHOLD } from "@/lib/labels";
import { dt, n, signed } from "@/lib/format";

/** 제작서 §19 — Trigger Monitor */
export default function AdminTriggersPage() {
  const board = voteBoard();
  const fired = board.filter((r) => r.triggered);
  const approaching = board.filter((r) => !r.triggered && r.diff > 0);

  return (
    <div className="space-y-5">
      <StatGrid>
        <Stat label="Trigger 발생" value={fired.length} tone={fired.length > 0 ? "alert" : "neutral"} />
        <Stat label="접근 중" value={approaching.length} tone={approaching.length > 0 ? "warn" : "neutral"} />
        <Stat label="기준 격차" value={`${n(TRIGGER_THRESHOLD)}표`} />
        <Stat label="시간당 증가" value="—" hint="백엔드 연결 후" />
      </StatGrid>

      <div
        className="rounded-xl border-2 px-4 py-3"
        style={{ borderColor: "var(--color-lv-high)", background: "color-mix(in srgb, var(--color-lv-high) 8%, transparent)" }}
      >
        <p className="text-[0.875rem] font-bold leading-relaxed" style={{ color: "var(--color-lv-high)" }}>
          1,000표 Trigger 는 “자동 위헌심판 청구”가 아니라 “헌재 제출 검토절차 자동 개시”입니다.
        </p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-dim">
          Trigger 가 발생해도 자동 제출은 금지입니다. 서류 자동작성 → 관리자·법률검토 → 적법한 청구인
          확인 → 청구인 동의·전자서명 → 전자헌법재판센터 제출 순서로만 진행합니다.
        </p>
      </div>

      <Panel title="Trigger 발생 법안" desc="발생 시점 스냅샷과 현재 집계를 함께 보존합니다 (§14)">
        {fired.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">현재 Trigger 가 발생한 법안이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {fired.map((r) => {
              const snap = r.bill.opinion.triggerSnapshot;
              return (
                <li key={r.bill.id} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                  <Link href={`/bills/${r.bill.id}`} className="text-[0.9375rem] font-bold">
                    {r.bill.fact.title}
                  </Link>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.8125rem] sm:grid-cols-4">
                    <Row label="발생 시각" value={r.bill.opinion.triggeredAt ? dt(r.bill.opinion.triggeredAt) : "-"} />
                    <Row label="당시 차이" value={snap ? signed(snap.difference) : "-"} />
                    <Row label="당시 검증 투표자" value={snap ? n(snap.verifiedVoterCount) : "-"} />
                    <Row label="현재 차이" value={signed(r.diff)} />
                  </dl>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[0.6875rem] font-bold">
                    <Tag color="#b98400">언론 발송 대기</Tag>
                    <Tag color="#b98400">헌재 검토패키지 미생성</Tag>
                    <Tag color="#6b7280">관리자 검토 전</Tag>
                  </div>
                  {snap && r.diff < snap.difference ? (
                    <p className="mt-2 text-[0.75rem] leading-relaxed" style={{ color: "var(--color-lv-high)" }}>
                      현재 격차가 발생 당시보다 줄었습니다. 기록은 삭제하지 않고 두 값을 모두 보존합니다.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Trigger 접근 법안" desc="부적합이 앞서는 법안">
        {approaching.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">해당 법안이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {approaching.map((r) => (
              <li key={r.bill.id}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <Link href={`/bills/${r.bill.id}`} className="text-[0.875rem] font-bold">
                    {r.bill.fact.title}
                  </Link>
                  <span className="text-[0.8125rem] font-bold tabular-nums" style={{ color: "var(--color-lv-void)" }}>
                    부적합 {signed(r.diff)}
                  </span>
                  <span className="text-[0.8125rem] tabular-nums text-faint">
                    {n(r.remaining)}표 후 Trigger
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, r.triggerPct)}%`, background: "var(--color-lv-high)" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="이상투표 감시">
        <LiveOnly what="시간당 투표 증가 · 이상 패턴 · 검증 투표자 비율" />
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-faint">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5"
      style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {children}
    </span>
  );
}
