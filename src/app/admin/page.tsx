"use client";

import Link from "next/link";
import { Panel, Stat, StatGrid, TableWrap, LiveOnly } from "@/components/admin/ui";
import { factKpis, healthMeta, systemHealth, todayChanges, voteBoard } from "@/lib/admin";
import { courtLabel } from "@/lib/labels";
import { siteMeta } from "@/lib/repo";
import { dt, n, signed } from "@/lib/format";

/** 제작서 §18, §34 — 관리자 메인 */
export default function AdminDashboard() {
  const health = systemHealth();
  const kpi = factKpis();
  const board = voteBoard();

  return (
    <div className="space-y-5">
      {/* ── KPI ── */}
      <StatGrid>
        <Stat
          label="공식 데이터 마지막 동기화"
          value={siteMeta.lastSyncedAt ? dt(siteMeta.lastSyncedAt).slice(0, 16) : "이력 없음"}
          tone={siteMeta.lastSyncedAt ? "neutral" : "warn"}
        />
        <Stat label="수집된 법안" value={kpi.totalBills} hint={`출처 ${siteMeta.dataOrigin === "OFFICIAL" ? "공식 기록" : "예시 데이터"}`} />
        <Stat
          label="헌재 결정 있음"
          value={kpi.courtRuled}
          tone={kpi.courtRuled > 0 ? "warn" : "neutral"}
          hint="공식 결정 기준 — 감시자들 등급 아님"
        />
        <Stat
          label="위헌 결정"
          value={kpi.unconstitutional}
          tone={kpi.unconstitutional > 0 ? "alert" : "neutral"}
        />
        <Stat label="Trigger 발생" value={kpi.triggered} tone={kpi.triggered > 0 ? "alert" : "neutral"} />
        <Stat label="1,000표 근접" value={kpi.nearTrigger} tone={kpi.nearTrigger > 0 ? "warn" : "neutral"} hint="200표 이내" />
        <Stat label="현재 접속자" value="—" hint="백엔드 연결 후" />
        <Stat label="오늘 투표수" value="—" hint="백엔드 연결 후" />
      </StatGrid>

      {/* ── 시스템 상태 (§18.1) ── */}
      <Panel title="시스템 상태" desc="공식 데이터 수집 파이프라인">
        <ul className="space-y-2">
          {health.map((h) => (
            <li key={h.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="shrink-0 font-bold" style={{ color: healthMeta[h.level].color }}>
                {healthMeta[h.level].dot} {healthMeta[h.level].label}
              </span>
              <span className="text-[0.875rem] font-semibold">{h.label}</span>
              <span className="text-[0.875rem] tabular-nums text-dim">{h.value}</span>
              {h.hint ? <span className="w-full text-[0.75rem] text-faint sm:w-auto">{h.hint}</span> : null}
            </li>
          ))}
        </ul>
        <Link href="/admin/system" className="mt-3 inline-block text-[0.8125rem] font-bold" style={{ color: "var(--text-2)" }}>
          동기화 로그 전체 보기 →
        </Link>
      </Panel>

      {/* ── 오늘의 공식 데이터 변경 (§18.2) ── */}
      <Panel title="오늘의 공식 데이터 변경" desc="전일 대비">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {todayChanges().map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-xl px-3 py-2.5"
              style={{ background: "var(--surface-2)" }}
            >
              <p className="text-[0.6875rem] leading-tight text-faint">{c.label}</p>
              <p
                className="mt-0.5 text-lg font-black tabular-nums"
                style={{ color: c.value > 0 ? "var(--fact-fg)" : "var(--text-3)" }}
              >
                {c.value > 0 ? `+${c.value}` : "0"}
              </p>
            </Link>
          ))}
        </div>
      </Panel>

      {/* ── 투표 현황 (§18.4) ── */}
      <Panel title="투표 현황" desc="부적합 − 적합 격차 순" action={<Link href="/admin/triggers" className="text-[0.8125rem] font-bold" style={{ color: "var(--text-2)" }}>Trigger Monitor →</Link>}>
        <TableWrap>
          <thead>
            <tr className="border-b text-left text-[0.6875rem] text-faint">
              <th className="py-2 pr-3 font-bold">법안</th>
              <th className="py-2 pr-3 text-right font-bold">부적합</th>
              <th className="py-2 pr-3 text-right font-bold">적합</th>
              <th className="py-2 pr-3 text-right font-bold">차이</th>
              <th className="py-2 pr-3 font-bold">Trigger</th>
            </tr>
          </thead>
          <tbody>
            {board.map((r) => (
              <tr key={r.bill.id} className="border-b last:border-b-0">
                <td className="py-2 pr-3">
                  <Link href={`/bills/${r.bill.id}`} className="font-semibold">
                    {r.bill.fact.title}
                  </Link>
                  {r.bill.fact.courtStatus !== "NONE" ? (
                    <span className="ml-1.5 rounded px-1 py-0.5 text-[0.625rem] font-bold text-faint">
                      {courtLabel[r.bill.fact.courtStatus]}
                    </span>
                  ) : null}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{n(r.unfit)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{n(r.fit)}</td>
                <td className="py-2 pr-3 text-right font-bold tabular-nums">{signed(r.diff)}</td>
                <td className="py-2 pr-3">
                  {r.triggered ? (
                    <span className="font-extrabold" style={{ color: "var(--color-lv-void)" }}>
                      발동
                    </span>
                  ) : r.diff > 0 ? (
                    <span className="tabular-nums text-dim">{r.triggerPct}%</span>
                  ) : (
                    <span className="text-faint">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <p className="mt-3 text-[0.75rem] text-faint">
          위 수치는 빌드 시점의 값입니다. 실시간 집계·부정투표 탐지는 백엔드 연결 후 표시됩니다.
        </p>
      </Panel>

      {/* ── 방문 현황 (§18.3) ── */}
      <Panel title="방문 현황" desc="개인정보를 과도하게 수집하지 않습니다">
        <LiveOnly what="오늘 방문자 · 현재 접속자 · 페이지뷰 · 가장 많이 본 법안 · 유입 경로" />
      </Panel>
    </div>
  );
}
