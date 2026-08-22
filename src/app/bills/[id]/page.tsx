import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bills, getBill, getLegislator, getParty, groupByParty, summaryOf } from "@/lib/repo";
import { SummaryZone, FactZone, OpinionZone } from "@/components/Zone";
import { CourtPill, SourceLink, StatusPill } from "@/components/Badges";
import { Timeline } from "@/components/Timeline";
import { VoteBreakdown } from "@/components/VoteBreakdown";
import { CitizenVotePanel } from "@/components/CitizenVotePanel";
import { CommentPanel } from "@/components/CommentPanel";
import { NOT_CONFIRMED_NOTICE, courtLabel, needsNotConfirmedNotice, statusLabel } from "@/lib/labels";
import { commentsFor } from "@/lib/site";
import { d, n } from "@/lib/format";
import type { OfficialSource } from "@/lib/types";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return bills.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const bill = getBill(id);
  if (!bill) return { title: "법안을 찾을 수 없습니다" };
  return {
    title: bill.fact.title,
    description: summaryOf(bill).whatItIs,
  };
}

export default async function BillDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const bill = getBill(id);
  if (!bill) notFound();

  const { fact, opinion } = bill;
  const summary = summaryOf(bill);
  const showNotice = needsNotConfirmedNotice(fact.courtStatus);
  const sponsor = fact.proposal.sponsorId ? getLegislator(fact.proposal.sponsorId) : undefined;
  const sponsorParty = sponsor ? getParty(sponsor.partyId) : undefined;

  return (
    <article className="pb-4">
      {/* ── 헤더 ── */}
      <nav className="pt-2 text-[0.8125rem] font-semibold text-faint">
        <Link href="/bills">법안</Link> <span aria-hidden>›</span> <span>{fact.committee}</span>
      </nav>

      <header className="mt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={fact.status} />
          <CourtPill status={fact.courtStatus} size="md" />
        </div>
        <h1 className="mt-2 text-[1.375rem] font-black leading-snug tracking-tight md:text-3xl">
          {fact.title}
        </h1>
        <p className="mt-1.5 font-mono text-[0.8125rem] font-semibold text-faint">
          의안번호 {fact.billNo}
        </p>
      </header>

      {/* ── 페이지 내 이동 ── */}
      <nav
        aria-label="문서 내 이동"
        className="no-scrollbar -mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
      >
        {[
          ["#summary", "쉬운 요약"],
          ["#fact", "FACT"],
          ["#timeline", "입법 경과"],
          ["#proposers", "발의자"],
          ["#vote", "표결"],
          ["#court", "헌재 판단"],
          ["#sources", "공식 원문"],
          ["#opinion", "시민 투표"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="surface shrink-0 rounded-full px-3 py-1.5 text-[0.8125rem] font-bold"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-2)" }}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-5 space-y-5 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-5 lg:space-y-0">
        {/* ── 본문 열 ── */}
        <div className="space-y-5">
          {/* 쉬운 요약 — 판단·등급 없는 사실 paraphrase */}
          <SummaryZone id="summary" title="쉬운 요약">
            <dl className="space-y-3.5">
              <div>
                <dt className="text-[0.75rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
                  무슨 법인가
                </dt>
                <dd className="mt-1 text-[1.0625rem] font-semibold leading-relaxed">{summary.whatItIs}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
                  왜 만들었나
                </dt>
                <dd className="mt-1 text-[0.9375rem] leading-relaxed">{summary.whyMade}</dd>
              </div>
            </dl>
          </SummaryZone>

          {/* 헌재 판단 전 필수 고지 */}
          {showNotice ? (
            <p
              className="rounded-xl border-2 px-4 py-3 text-[0.875rem] font-bold leading-relaxed"
              style={{
                borderColor: "var(--color-lv-high)",
                color: "var(--color-lv-high)",
                background: "color-mix(in srgb, var(--color-lv-high) 8%, transparent)",
              }}
            >
              {NOT_CONFIRMED_NOTICE}
            </p>
          ) : null}

          {/* FACT 박스 */}
          <FactZone
            id="fact"
            title="법안 기본정보"
            note="위 항목은 국가기관 공식 기록에서 확인한 값입니다. 감시자들이 추측해 채우지 않습니다."
          >
            <dl className="divide-y" style={{ borderColor: "var(--border)" }}>
              <FactRow label="법안명" value={fact.title} source={fact.sources[0]} />
              <FactRow label="의안번호" value={fact.billNo} mono />
              <FactRow label="발의일" value={d(fact.proposal.proposedAt)} />
              <FactRow
                label="발의 형태"
                value={
                  fact.proposal.kind === "위원회대안"
                    ? `위원회 대안 (${fact.proposal.committeeAlternativeBy ?? "위원회"})`
                    : fact.proposal.kind
                }
              />
              <FactRow
                label="대표발의자"
                value={sponsor ? `${sponsor.name} / ${sponsorParty?.name} / ${sponsor.district}` : "해당 없음"}
              />
              <FactRow
                label="공동발의자"
                value={
                  fact.proposal.coSponsorIds.length > 0
                    ? `${n(fact.proposal.coSponsorIds.length)}명`
                    : "해당 없음"
                }
              />
              <FactRow label="소관위원회" value={fact.committee} />
              <FactRow label="현재 처리상태" value={statusLabel[fact.status]} />
              <FactRow label="공포" value={fact.promulgatedAt ? d(fact.promulgatedAt) : "공포되지 않음"} />
              <FactRow
                label="시행"
                value={
                  fact.status === "IN_FORCE"
                    ? `시행 중 (${fact.effectiveAt ? d(fact.effectiveAt) : "일자 확인 필요"})`
                    : fact.effectiveAt
                      ? `${d(fact.effectiveAt)} 시행 예정`
                      : "시행일 미정"
                }
              />
            </dl>
          </FactZone>

          {/* 공식 제안이유 원문 */}
          <FactZone
            title="공식 제안이유 (원문 발췌)"
            note="「제안이유 및 주요내용」에 적힌 내용만 표시합니다. 발의 동기를 추측하지 않습니다."
            action={
              fact.proposal.officialReasonSource ? (
                <SourceLink source={fact.proposal.officialReasonSource} compact />
              ) : null
            }
          >
            <blockquote className="quote-const whitespace-pre-line">
              {fact.proposal.officialReasonExcerpt}
            </blockquote>
          </FactZone>

          {/* 입법 진행경과 */}
          <FactZone id="timeline" title="입법 진행경과">
            <Timeline events={fact.events} />
          </FactZone>

          {/* 발의자 및 공동발의자 */}
          <FactZone id="proposers" title="발의자 및 공동발의자">
            <Proposers fact={fact} />
          </FactZone>

          {/* 본회의 표결 */}
          <FactZone
            id="vote"
            title="본회의 표결"
            note={
              fact.vote
                ? `${fact.vote.sessionLabel} · ${d(fact.vote.date)} · ${fact.vote.result}` +
                  (fact.voteAbsentInferred
                    ? " · 불참 명단은 공식 표결기록에 포함되지 않아 재적 의원에서 표결 참여자를 뺀 값입니다."
                    : "")
                : undefined
            }
            action={fact.vote?.source ? <SourceLink source={fact.vote.source} compact /> : null}
          >
            {fact.vote ? (
              <VoteBreakdown vote={fact.vote} />
            ) : (
              <p className="text-[0.9375rem] text-dim">
                아직 본회의 표결 기록이 없습니다. 위원회 심사 단계이거나 계류 중인 법안입니다.
              </p>
            )}
          </FactZone>

          {/* 헌법재판소 판단 — 이 사이트가 표시하는 유일한 위헌 여부 신호 */}
          <FactZone
            id="court"
            title="헌법재판소 판단"
            note="위헌 여부는 헌법재판소의 공식 결정만을 근거로 합니다. 감시자들 자체의 헌법적 논거·등급은 제공하지 않습니다."
          >
            <div className="flex items-center gap-2">
              <CourtPill status={fact.courtStatus} size="md" />
              {fact.courtCaseNo ? (
                <span className="font-mono text-[0.8125rem] text-dim">사건번호 {fact.courtCaseNo}</span>
              ) : null}
            </div>
            {fact.courtStatus === "NONE" ? (
              <p className="mt-2 text-[0.875rem] text-dim">
                이 법안에 대한 헌법재판소의 공식 결정은 아직 없습니다.
              </p>
            ) : null}
          </FactZone>

          {/* 공식 원문 모음 */}
          <FactZone id="sources" title="공식 원문">
            <ul className="space-y-2">
              {fact.sources.map((s) => (
                <li key={`${s.agency}-${s.label}`} className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-[0.6875rem] font-bold"
                    style={{ background: "var(--fact-bg)", color: "var(--fact-fg)" }}
                  >
                    {s.agency}
                  </span>
                  <span className="text-[0.9375rem]">{s.label}</span>
                  <span className="ml-auto">
                    <SourceLink source={s} compact />
                  </span>
                </li>
              ))}
            </ul>
          </FactZone>

          {/* 시민 헌법의견투표 */}
          <OpinionZone id="opinion" title="시민 헌법의견투표">
            <CitizenVotePanel billId={bill.id} tally={opinion} />
          </OpinionZone>

          {/* 시민 코멘트 */}
          <OpinionZone title="시민 코멘트">
            <CommentPanel billId={bill.id} initial={commentsFor(bill.id)} />
          </OpinionZone>
        </div>

        {/* ── 데스크톱 사이드 요약 ── */}
        <aside className="hidden lg:sticky lg:top-28 lg:block">
          <div className="surface rounded-2xl p-4">
            <p className="text-[0.75rem] font-extrabold text-faint">한눈에 보기</p>
            <p className="mt-1.5 text-[0.9375rem] font-semibold leading-relaxed">{summary.whatItIs}</p>
            <dl className="mt-3 space-y-2 border-t pt-3 text-[0.8125rem]">
              <SideRow label="현재 상태" value={statusLabel[fact.status]} />
              <SideRow label="헌재 판단" value={courtLabel[fact.courtStatus]} />
              <SideRow
                label="표결"
                value={
                  fact.vote
                    ? `찬 ${n(fact.vote.for.length)} / 반 ${n(fact.vote.against.length)} / 기 ${n(fact.vote.abstain.length)} / 불 ${n(fact.vote.absent.length)}`
                    : "기록 없음"
                }
              />
              <SideRow label="발의일" value={d(fact.proposal.proposedAt)} />
              <SideRow label="소관위" value={fact.committee} />
            </dl>
            <a
              href="#opinion"
              className="mt-4 block rounded-xl px-3 py-2.5 text-center text-sm font-bold"
              style={{ background: "var(--color-opinion)", color: "#fff" }}
            >
              시민 헌법의견투표 하기
            </a>
          </div>
        </aside>
      </div>
    </article>
  );
}

function Proposers({ fact }: { fact: NonNullable<ReturnType<typeof getBill>>["fact"] }) {
  const sponsor = fact.proposal.sponsorId ? getLegislator(fact.proposal.sponsorId) : undefined;
  const sponsorParty = sponsor ? getParty(sponsor.partyId) : undefined;
  return (
    <>
      {sponsor ? (
        <div className="mb-4">
          <p className="mb-1.5 text-[0.75rem] font-extrabold" style={{ color: "var(--fact-fg)" }}>
            대표발의자
          </p>
          <Link
            href={`/legislators/${sponsor.id}`}
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: sponsorParty?.color }} />
            <span className="min-w-0">
              <span className="block font-bold">{sponsor.name}</span>
              <span className="block text-[0.8125rem] text-dim">
                {sponsorParty?.name} · {sponsor.district}
              </span>
            </span>
            <span className="ml-auto text-[0.8125rem] font-bold text-faint">기록 보기 →</span>
          </Link>
        </div>
      ) : (
        <p className="mb-4 text-[0.9375rem] text-dim">
          {fact.proposal.kind === "정부제출"
            ? "정부가 제출한 법률안으로 대표발의자가 없습니다."
            : `위원회 대안으로 ${fact.proposal.committeeAlternativeBy ?? "위원회"}가 최종안을 제안했습니다.`}
        </p>
      )}

      <p className="mb-1.5 text-[0.75rem] font-extrabold" style={{ color: "var(--fact-fg)" }}>
        공동발의자 {n(fact.proposal.coSponsorIds.length)}명
      </p>
      {fact.proposal.coSponsorIds.length === 0 ? (
        <p className="text-[0.9375rem] text-dim">공동발의자가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {groupByParty(fact.proposal.coSponsorIds).map(({ party, members }) => (
            <li key={party.id}>
              <div className="mb-1.5 flex items-center gap-2">
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: party.color }} />
                <span className="text-[0.8125rem] font-bold">{party.name}</span>
                <span className="text-[0.8125rem] font-bold tabular-nums text-faint">{n(members.length)}명</span>
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
    </>
  );
}

function FactRow({
  label,
  value,
  source,
  mono,
}: {
  label: string;
  value: string;
  source?: OfficialSource;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
      <dt className="w-24 shrink-0 text-[0.8125rem] font-semibold text-faint">{label}</dt>
      <dd className={`min-w-0 flex-1 text-[0.9375rem] font-semibold ${mono ? "font-mono" : ""}`}>{value}</dd>
      {source ? <SourceLink source={source} compact /> : null}
    </div>
  );
}

function SideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-faint">{label}</dt>
      <dd className="min-w-0 flex-1 font-semibold">{value}</dd>
    </div>
  );
}
