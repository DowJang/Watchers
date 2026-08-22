import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { legislators, getLegislator, getParty } from "@/lib/repo";
import { billsByLegislator } from "@/lib/site";
import { FactZone } from "@/components/Zone";
import { CourtPill, SourceLink, StatusPill } from "@/components/Badges";
import { voteMeta } from "@/lib/labels";
import { d, n } from "@/lib/format";
import type { Bill, VoteChoice } from "@/lib/types";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return legislators.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const l = getLegislator(id);
  if (!l) return { title: "의원을 찾을 수 없습니다" };
  return { title: `${l.name} 의원`, description: `${l.name} 의원의 발의·표결 기록` };
}

export default async function LegislatorPage({ params }: { params: Params }) {
  const { id } = await params;
  const l = getLegislator(id);
  if (!l) notFound();

  const party = getParty(l.partyId);
  const { sponsored, coSponsored, voted } = billsByLegislator(l.id);

  const counts = voted.reduce<Record<VoteChoice, number>>(
    (acc, v) => {
      acc[v.choice] += 1;
      return acc;
    },
    { FOR: 0, AGAINST: 0, ABSTAIN: 0, ABSENT: 0 },
  );

  return (
    <>
      <nav className="pt-2 text-[0.8125rem] font-semibold text-faint">
        <Link href="/legislators">의원</Link> <span aria-hidden>›</span> <span>{party.name}</span>
      </nav>

      <header className="mt-2 flex items-center gap-3">
        <span
          aria-hidden
          className="size-14 shrink-0 rounded-full"
          style={{
            background: `color-mix(in srgb, ${party.color} 22%, transparent)`,
            border: `3px solid ${party.color}`,
          }}
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">{l.name}</h1>
          <p className="text-[0.9375rem] font-semibold text-dim">
            {party.name} · {l.district}
          </p>
        </div>
      </header>

      {l.officialUrl ? (
        <p className="mt-3">
          <SourceLink source={{ agency: "국회", label: "공식 국회의원 정보", url: l.officialUrl }} />
        </p>
      ) : null}

      <div className="mt-5 space-y-5">
        {/* 표결 요약 */}
        <FactZone
          title="본회의 표결 기록 요약"
          note="불참은 반대로 계산하지 않습니다. 표결 성향에 대한 평가나 점수는 제공하지 않습니다."
        >
          <dl className="grid grid-cols-4 gap-2 text-center">
            {(Object.keys(counts) as VoteChoice[]).map((k) => (
              <div key={k} className="rounded-xl px-2 py-2.5" style={{ background: "var(--surface-2)" }}>
                <dt className="text-[0.75rem] font-bold" style={{ color: voteMeta[k].color }}>
                  {voteMeta[k].label}
                </dt>
                <dd className="text-xl font-black tabular-nums">{n(counts[k])}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-4 divide-y" style={{ borderColor: "var(--border)" }}>
            {voted.length === 0 ? (
              <li className="py-2 text-[0.9375rem] text-dim">표결 기록이 없습니다.</li>
            ) : (
              voted.map(({ bill, choice }) => (
                <li key={bill.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Link href={`/bills/${bill.id}`} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[0.6875rem] font-extrabold"
                      style={{
                        color: voteMeta[choice].color,
                        background: `color-mix(in srgb, ${voteMeta[choice].color} 12%, transparent)`,
                      }}
                    >
                      {voteMeta[choice].label}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] font-semibold leading-snug">
                        {bill.fact.title}
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] text-faint tabular-nums">
                        {bill.fact.vote ? d(bill.fact.vote.date) : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </FactZone>

        <BillListZone title={`대표발의 ${n(sponsored.length)}건`} bills={sponsored} />
        <BillListZone title={`공동발의 ${n(coSponsored.length)}건`} bills={coSponsored} />
      </div>
    </>
  );
}

function BillListZone({ title, bills }: { title: string; bills: Bill[] }) {
  return (
    <FactZone title={title}>
      {bills.length === 0 ? (
        <p className="text-[0.9375rem] text-dim">해당 기록이 없습니다.</p>
      ) : (
        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
          {bills.map((b) => (
            <li key={b.id} className="py-2.5 first:pt-0 last:pb-0">
              <Link href={`/bills/${b.id}`} className="block">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusPill status={b.fact.status} />
                  {b.fact.courtStatus !== "NONE" ? <CourtPill status={b.fact.courtStatus} /> : null}
                  <span className="text-[0.75rem] text-faint tabular-nums">
                    {d(b.fact.proposal.proposedAt)}
                  </span>
                </div>
                <p className="mt-1 text-[0.9375rem] font-semibold leading-snug">{b.fact.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </FactZone>
  );
}
