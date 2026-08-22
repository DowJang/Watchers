import Link from "next/link";
import type { Bill } from "@/lib/types";
import { getLegislator, getParty, summaryOf } from "@/lib/repo";
import { CourtPill, StatusPill } from "./Badges";
import { n } from "@/lib/format";

/**
 * 법안 목록 카드.
 * 위헌 여부는 헌법재판소의 공식 결정(courtStatus)만 표시한다 — 감시자들의 등급·논거는 없다.
 */
export function BillCard({ bill }: { bill: Bill }) {
  const { fact } = bill;
  const summary = summaryOf(bill);
  const sponsor = fact.proposal.sponsorId ? getLegislator(fact.proposal.sponsorId) : undefined;
  const party = sponsor ? getParty(sponsor.partyId) : undefined;
  const v = fact.vote;

  return (
    <article
      className="surface rounded-2xl transition-shadow hover:shadow-md focus-within:shadow-md"
      style={{ borderColor: "var(--border)" }}
    >
      <Link href={`/bills/${bill.id}`} className="block p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <StatusPill status={fact.status} />
          {fact.courtStatus !== "NONE" ? <CourtPill status={fact.courtStatus} /> : null}
        </div>

        <h3 className="text-[1.0625rem] font-extrabold leading-snug sm:text-lg">{fact.title}</h3>

        {/* 쉬운 요약 — 평가를 담지 않은 사실 paraphrase */}
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-dim">{summary.whatItIs}</p>

        {/* 발의 · 표결 */}
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 border-t pt-3 text-[0.8125rem] xs:grid-cols-2">
          <div className="flex gap-2">
            <dt className="shrink-0 text-faint">발의</dt>
            <dd className="font-semibold">
              {fact.proposal.kind === "의원발의" && sponsor
                ? `${sponsor.name} / ${party?.name}`
                : fact.proposal.kind === "정부제출"
                  ? "정부 제출"
                  : `위원회 대안 (${fact.proposal.committeeAlternativeBy ?? "위원회"})`}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-faint">의안번호</dt>
            <dd className="font-mono font-semibold">{fact.billNo}</dd>
          </div>
          <div className="flex gap-2 xs:col-span-2">
            <dt className="shrink-0 text-faint">표결</dt>
            <dd className="font-semibold tabular-nums">
              {v
                ? `찬성 ${n(v.for.length)} / 반대 ${n(v.against.length)} / 기권 ${n(v.abstain.length)} / 불참 ${n(v.absent.length)}`
                : "본회의 표결 기록 없음"}
            </dd>
          </div>
        </dl>
      </Link>
    </article>
  );
}
