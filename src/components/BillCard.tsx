import Link from "next/link";
import type { Bill } from "@/lib/types";
import { getLegislator, getParty } from "@/data/people";
import { ConflictBadge, CourtPill, Keyword, StatusPill } from "./Badges";
import { n } from "@/lib/format";

/**
 * 제작서 §4 — 법안 목록 카드.
 * 한 장 안에서 [무슨 법인가 / 헌법쟁점 / 누가 / 상태 / 표결 / 법적 상태]가 모두 보여야 한다.
 */
export function BillCard({ bill }: { bill: Bill }) {
  const { fact, analysis } = bill;
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
          <ConflictBadge level={analysis.conflictLevel} size="sm" />
          <StatusPill status={fact.status} />
          <CourtPill status={fact.courtStatus} />
        </div>

        <h3 className="text-[1.0625rem] font-extrabold leading-snug sm:text-lg">{fact.title}</h3>

        {/* 한눈에 보기 — 쉬운 설명 */}
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-dim">{analysis.whatItIs}</p>

        {/* VS 헌법 */}
        <div
          className="mt-3 rounded-lg border border-dashed px-3 py-2"
          style={{ borderColor: "var(--analysis-bd)", background: "var(--analysis-bg)" }}
        >
          <p className="text-[0.6875rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
            VS 헌법
          </p>
          <p className="mt-0.5 text-[0.875rem] leading-relaxed" style={{ color: "var(--text)" }}>
            {analysis.coreIssue}
          </p>
        </div>

        {/* 핵심 키워드 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {analysis.keywords.map((k) => (
            <Keyword key={k}>{k}</Keyword>
          ))}
        </div>

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
