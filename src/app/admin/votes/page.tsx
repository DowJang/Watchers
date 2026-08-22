"use client";

import Link from "next/link";
import { Panel, Stat, StatGrid, TableWrap, LiveOnly } from "@/components/admin/ui";
import { voteBoard } from "@/lib/admin";
import { n, signed } from "@/lib/format";

/** 제작서 §18.4 — 투표 Monitor */
export default function AdminVotesPage() {
  const board = voteBoard();
  const totalUnfit = board.reduce((s, r) => s + r.unfit, 0);
  const totalFit = board.reduce((s, r) => s + r.fit, 0);
  const most = [...board].sort((a, b) => b.unfit + b.fit - (a.unfit + a.fit))[0];
  const widest = board[0];

  return (
    <div className="space-y-5">
      <StatGrid>
        <Stat label="누적 부적합" value={totalUnfit} tone="alert" />
        <Stat label="누적 적합" value={totalFit} tone="good" />
        <Stat label="누적 투표수" value={totalUnfit + totalFit} />
        <Stat label="오늘 투표수" value="—" hint="백엔드 연결 후" />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="가장 투표가 많은 법안">
          {most ? (
            <>
              <Link href={`/bills/${most.bill.id}`} className="text-[0.9375rem] font-bold">
                {most.bill.fact.title}
              </Link>
              <p className="mt-1 text-[0.8125rem] tabular-nums text-dim">
                총 {n(most.unfit + most.fit)}표 · 부적합 {n(most.unfit)} / 적합 {n(most.fit)}
              </p>
            </>
          ) : (
            <p className="text-sm text-dim">데이터 없음</p>
          )}
        </Panel>
        <Panel title="가장 격차가 큰 법안">
          {widest ? (
            <>
              <Link href={`/bills/${widest.bill.id}`} className="text-[0.9375rem] font-bold">
                {widest.bill.fact.title}
              </Link>
              <p className="mt-1 text-[0.8125rem] tabular-nums text-dim">차이 {signed(widest.diff)}</p>
            </>
          ) : (
            <p className="text-sm text-dim">데이터 없음</p>
          )}
        </Panel>
      </div>

      <Panel title="법안별 집계">
        <TableWrap>
          <thead>
            <tr className="border-b text-left text-[0.6875rem] text-faint">
              <th className="py-2 pr-3 font-bold">법안</th>
              <th className="py-2 pr-3 text-right font-bold">부적합</th>
              <th className="py-2 pr-3 text-right font-bold">적합</th>
              <th className="py-2 pr-3 text-right font-bold">차이</th>
              <th className="py-2 pr-3 text-right font-bold">Trigger</th>
            </tr>
          </thead>
          <tbody>
            {board.map((r) => (
              <tr key={r.bill.id} className="border-b last:border-b-0">
                <td className="py-2 pr-3">
                  <Link href={`/bills/${r.bill.id}`} className="font-semibold">
                    {r.bill.fact.title}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{n(r.unfit)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{n(r.fit)}</td>
                <td className="py-2 pr-3 text-right font-bold tabular-nums">{signed(r.diff)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {r.triggered ? "발동" : r.diff > 0 ? `${r.triggerPct}%` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <Panel title="부정투표 탐지" desc="제작서 §27 — 단순 IP 만으로 동일인을 판정하지 않습니다">
        <LiveOnly what="투표속도 이상치 · 동일 패턴 대량투표 · 데이터센터/봇 트래픽 · 계정생성 이상치" />
      </Panel>
    </div>
  );
}
