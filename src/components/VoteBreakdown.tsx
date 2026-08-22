"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlenaryVote, VoteChoice } from "@/lib/types";
import { voteMeta, voteOrder } from "@/lib/labels";
import { groupByParty } from "@/data/people";
import { n, pct } from "@/lib/format";

/**
 * 제작서 §5.5 — 본회의 표결.
 * 찬성·반대·기권·불참 네 그룹을 완전히 분리하고, 정당별 총계도 제공한다.
 * 불참은 반대로 계산하지 않는다(§2.2).
 */
export function VoteBreakdown({ vote }: { vote: PlenaryVote }) {
  const [open, setOpen] = useState<VoteChoice>("FOR");

  const groups: Record<VoteChoice, string[]> = {
    FOR: vote.for,
    AGAINST: vote.against,
    ABSTAIN: vote.abstain,
    ABSENT: vote.absent,
  };
  const total = voteOrder.reduce((s, k) => s + groups[k].length, 0);

  return (
    <div>
      {/* 요약 4분할 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {voteOrder.map((k) => {
          const count = groups[k].length;
          const active = open === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setOpen(k)}
              aria-pressed={active}
              className="rounded-xl border px-3 py-2.5 text-left transition-colors"
              style={{
                borderColor: active ? voteMeta[k].color : "var(--border)",
                background: active
                  ? `color-mix(in srgb, ${voteMeta[k].color} 10%, transparent)`
                  : "var(--surface)",
              }}
            >
              <p className="text-[0.75rem] font-bold" style={{ color: voteMeta[k].color }}>
                {voteMeta[k].label}
              </p>
              <p className="text-xl font-black tabular-nums">{n(count)}</p>
              <p className="text-[0.6875rem] text-faint tabular-nums">{pct(count, total)}%</p>
            </button>
          );
        })}
      </div>

      {/* 비율 막대 */}
      <div
        className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`찬성 ${vote.for.length}, 반대 ${vote.against.length}, 기권 ${vote.abstain.length}, 불참 ${vote.absent.length}`}
      >
        {voteOrder.map((k) => (
          <span
            key={k}
            style={{ width: `${pct(groups[k].length, total)}%`, background: voteMeta[k].color }}
          />
        ))}
      </div>

      <p className="mt-2 text-xs font-semibold" style={{ color: "var(--text-3)" }}>
        불참은 반대로 계산하지 않습니다.
      </p>

      {/* 선택한 그룹의 의원 명단 — 정당별 총계 포함 */}
      <div className="mt-4">
        <h3 className="mb-2 text-sm font-extrabold" style={{ color: voteMeta[open].color }}>
          {voteMeta[open].label} {n(groups[open].length)}명
        </h3>
        {groups[open].length === 0 ? (
          <p className="text-sm text-dim">해당 의원이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {groupByParty(groups[open]).map(({ party, members }) => (
              <li key={party.id}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ background: party.color }}
                  />
                  <span className="text-[0.8125rem] font-bold">{party.name}</span>
                  <span className="text-[0.8125rem] font-bold tabular-nums text-faint">
                    {n(members.length)}명
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => (
                    <Link
                      key={m.id}
                      href={`/legislators/${m.id}`}
                      className="rounded-md border px-2 py-1 text-[0.8125rem] font-semibold"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                    >
                      {m.name}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
