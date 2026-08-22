import type { Metadata } from "next";
import Link from "next/link";
import { legislators, parties, getParty } from "@/data/people";
import { billsByLegislator } from "@/lib/site";
import { n } from "@/lib/format";

export const metadata: Metadata = {
  title: "의원",
  description: "의원별 발의·표결 기록을 공식 기록 기준으로 확인합니다.",
};

export default function LegislatorsPage() {
  const rows = legislators
    .map((l) => {
      const { sponsored, coSponsored, voted } = billsByLegislator(l.id);
      return { l, sponsored: sponsored.length, coSponsored: coSponsored.length, voted: voted.length };
    })
    .sort((a, b) => b.sponsored - a.sponsored || a.l.name.localeCompare(b.l.name, "ko"));

  return (
    <>
      <header className="pb-1 pt-2">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">의원</h1>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-dim">
          누가 발의했고 본회의에서 어떻게 표결했는지를 공식 기록 기준으로 정리합니다. 평가나 호감도 점수는
          제공하지 않습니다.
        </p>
      </header>

      {/* 정당 범례 */}
      <ul className="mt-3 flex flex-wrap gap-2">
        {parties.map((p) => (
          <li key={p.id} className="flex items-center gap-1.5 text-[0.8125rem] font-semibold">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </li>
        ))}
      </ul>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ l, sponsored, coSponsored, voted }) => {
          const party = getParty(l.partyId);
          return (
            <li key={l.id}>
              <Link
                href={`/legislators/${l.id}`}
                className="surface flex h-full items-center gap-3 rounded-xl p-3 transition-shadow hover:shadow-md"
              >
                <span
                  aria-hidden
                  className="size-9 shrink-0 rounded-full"
                  style={{ background: `color-mix(in srgb, ${party.color} 22%, transparent)`, border: `2px solid ${party.color}` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{l.name}</span>
                  <span className="block truncate text-[0.8125rem] text-dim">
                    {party.name} · {l.district}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[0.6875rem] leading-tight text-faint">
                  <span className="block">대표 {n(sponsored)}</span>
                  <span className="block">공동 {n(coSponsored)}</span>
                  <span className="block">표결 {n(voted)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
