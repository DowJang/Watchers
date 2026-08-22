import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getPrinciple } from "@/data/constitution";
import {
  analysisOf,
  bills,
  getBill,
  getLegislator,
  getParty,
  groupByParty,
  isAnalysisPending,
} from "@/lib/repo";
import { AnalysisZone, FactZone, OpinionZone } from "@/components/Zone";
import { ConflictBadge, CourtPill, Keyword, SourceLink, StatusPill } from "@/components/Badges";
import { Timeline } from "@/components/Timeline";
import { VoteBreakdown } from "@/components/VoteBreakdown";
import { CitizenVotePanel } from "@/components/CitizenVotePanel";
import { CommentPanel } from "@/components/CommentPanel";
import { NOT_CONFIRMED_NOTICE, conflictMeta, needsNotConfirmedNotice, statusLabel } from "@/lib/labels";
import { commentsFor } from "@/lib/site";
import { d, n } from "@/lib/format";

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
    description: analysisOf(bill).whatItIs,
  };
}

export default async function BillDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const bill = getBill(id);
  if (!bill) notFound();

  const { fact, opinion } = bill;
  const analysis = analysisOf(bill);
  const pending = isAnalysisPending(bill);
  const sponsor = fact.proposal.sponsorId ? getLegislator(fact.proposal.sponsorId) : undefined;
  const sponsorParty = sponsor ? getParty(sponsor.partyId) : undefined;
  const showNotice = needsNotConfirmedNotice(analysis.conflictLevel, fact.courtStatus);

  return (
    <article className="pb-4">
      {/* ── 헤더 ── */}
      <nav className="pt-2 text-[0.8125rem] font-semibold text-faint">
        <Link href="/bills">법안</Link> <span aria-hidden>›</span> <span>{fact.committee}</span>
      </nav>

      <header className="mt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <ConflictBadge level={analysis.conflictLevel} full />
          <StatusPill status={fact.status} />
          <CourtPill status={fact.courtStatus} />
        </div>
        <h1 className="mt-2 text-[1.375rem] font-black leading-snug tracking-tight md:text-3xl">
          {fact.title}
        </h1>
        <p className="mt-1.5 font-mono text-[0.8125rem] font-semibold text-faint">
          의안번호 {fact.billNo}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {analysis.keywords.map((k) => (
            <Keyword key={k}>{k}</Keyword>
          ))}
        </div>
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
          ["#constitution", "VS 헌법"],
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
          {/* §5.1 쉬운 요약 */}
          <AnalysisZone
            id="summary"
            title="쉬운 요약"
            note={
              pending
                ? "이 법안은 공식 기록만 수집된 상태입니다. 헌법 분석을 자동으로 생성하지 않기 때문에, 작성이 끝나기 전까지는 충돌등급을 표시하지 않습니다."
                : undefined
            }
          >
            <dl className="space-y-3.5">
              <div>
                <dt className="text-[0.75rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
                  무슨 법인가
                </dt>
                <dd className="mt-1 text-[1.0625rem] font-semibold leading-relaxed">{analysis.whatItIs}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
                  왜 만들었나
                </dt>
                <dd className="mt-1 text-[0.9375rem] leading-relaxed">{analysis.whyMade}</dd>
              </div>
              <div>
                <dt className="text-[0.75rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
                  핵심 헌법쟁점
                </dt>
                <dd className="mt-1 text-[0.9375rem] leading-relaxed">{analysis.coreIssue}</dd>
              </div>
            </dl>
          </AnalysisZone>

          {/* §7 — 헌재 판단 전 필수 고지 */}
          {showNotice ? (
            <p
              className="rounded-xl border-2 px-4 py-3 text-[0.875rem] font-bold leading-relaxed"
              style={{
                borderColor: conflictMeta[analysis.conflictLevel].cssVar,
                color: conflictMeta[analysis.conflictLevel].cssVar,
                background: `color-mix(in srgb, ${conflictMeta[analysis.conflictLevel].cssVar} 8%, transparent)`,
              }}
            >
              {NOT_CONFIRMED_NOTICE}
            </p>
          ) : null}

          {/* §5.2 FACT 박스 */}
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
              <FactRow
                label="헌재 판단"
                value={
                  fact.courtCaseNo
                    ? `${courtText(fact.courtStatus)} · 사건번호 ${fact.courtCaseNo}`
                    : courtText(fact.courtStatus)
                }
              />
            </dl>
          </FactZone>

          {/* §2.3 왜 — 공식 제안이유 원문 */}
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

          {/* §5.3 입법 진행경과 */}
          <FactZone id="timeline" title="입법 진행경과">
            <Timeline events={fact.events} />
          </FactZone>

          {/* §5.4 발의자 및 공동발의자 */}
          <FactZone id="proposers" title="발의자 및 공동발의자">
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
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: sponsorParty?.color }}
                  />
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
          </FactZone>

          {/* §5.5 본회의 표결 */}
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

          {/* §6 VS 헌법 */}
          <AnalysisZone id="constitution" title="VS 헌법">
            {pending ? (
              <div className="py-2">
                <p className="text-[0.9375rem] font-semibold leading-relaxed">
                  이 법안의 헌법 대조는 아직 작성되지 않았습니다.
                </p>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-dim">
                  관련 헌법조항, 위헌·합헌 양측 논거, 관련 판례는 사람이 공식 기록을 확인한 뒤에만
                  게시합니다. 자동으로 생성해 채우지 않습니다. 그동안 위의 공식 기록과{" "}
                  <Link href="/constitution" className="font-bold underline">
                    헌법 조항
                  </Link>
                  을 직접 대조해 보실 수 있습니다.
                </p>
              </div>
            ) : (
              <>
            {/* 6.1 관련 헌법조항 */}
            <h3 className="text-[0.8125rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
              관련 헌법조항
            </h3>
            <ul className="mt-2 space-y-3">
              {analysis.articleIds.map((aid) => {
                const a = getArticle(aid);
                if (!a) return null;
                return (
                  <li key={aid}>
                    <Link href={`/constitution/${a.id}`} className="block">
                      <p className="text-[0.9375rem] font-bold">
                        헌법 {a.no} — {a.title}
                      </p>
                    </Link>
                    <blockquote className="quote-const mt-1.5">{a.text}</blockquote>
                    <p className="mt-1.5 text-[0.875rem] leading-relaxed text-dim">
                      <strong className="font-bold" style={{ color: "var(--analysis-fg)" }}>
                        쉬운 설명
                      </strong>{" "}
                      {a.plain}
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* 6.2 핵심 충돌 지점 */}
            <h3 className="mt-5 text-[0.8125rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
              핵심 충돌 지점
            </h3>
            <ul className="mt-2 space-y-2">
              {analysis.principleIds.map((pid) => {
                const p = getPrinciple(pid);
                if (!p) return null;
                return (
                  <li
                    key={pid}
                    className="rounded-lg px-3 py-2"
                    style={{ background: "var(--analysis-bg)" }}
                  >
                    <p className="text-[0.9375rem] font-bold">{p.term}</p>
                    <p className="text-[0.875rem] leading-relaxed text-dim">→ {p.plain}</p>
                  </li>
                );
              })}
            </ul>

            {/* 6.3 / 6.4 양측 논거 */}
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <ArgumentList
                title="위헌 측 논거"
                color="var(--color-lv-void)"
                items={analysis.argumentsAgainst}
              />
              <ArgumentList title="합헌 측 논거" color="#1f8a5b" items={analysis.argumentsFor} />
            </div>

            {/* 6.5 공식 판례 */}
            <h3 className="mt-5 text-[0.8125rem] font-extrabold" style={{ color: "var(--analysis-fg)" }}>
              관련 공식 판례·결정
            </h3>
            <ul className="mt-2 space-y-2">
              {analysis.cases.map((c) => (
                <li
                  key={`${c.court}-${c.caseNo}-${c.title}`}
                  className="rounded-lg border p-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="text-[0.75rem] font-bold text-faint">
                    {c.court} · {c.caseNo}
                  </p>
                  <p className="mt-0.5 text-[0.9375rem] font-bold">{c.title}</p>
                  <p className="mt-0.5 text-[0.875rem] leading-relaxed text-dim">{c.summary}</p>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-[0.75rem] text-faint">분석 최종 검토 {d(analysis.reviewedAt)}</p>
              </>
            )}
          </AnalysisZone>

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

          {/* §8 시민 헌법의견투표 */}
          <OpinionZone id="opinion" title="시민 헌법의견투표">
            <CitizenVotePanel billId={bill.id} tally={opinion} />
          </OpinionZone>

          {/* §15 시민 코멘트 */}
          <OpinionZone title="시민 코멘트">
            <CommentPanel billId={bill.id} initial={commentsFor(bill.id)} />
          </OpinionZone>
        </div>

        {/* ── 데스크톱 사이드 요약 ── */}
        <aside className="hidden lg:sticky lg:top-28 lg:block">
          <div className="surface rounded-2xl p-4">
            <p className="text-[0.75rem] font-extrabold text-faint">한눈에 보기</p>
            <p className="mt-1.5 text-[0.9375rem] font-semibold leading-relaxed">{analysis.whatItIs}</p>
            <dl className="mt-3 space-y-2 border-t pt-3 text-[0.8125rem]">
              <SideRow label="충돌등급" value={conflictMeta[analysis.conflictLevel].label} />
              <SideRow label="현재 상태" value={statusLabel[fact.status]} />
              <SideRow label="법적 상태" value={courtText(fact.courtStatus)} />
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

function courtText(s: import("@/lib/types").CourtStatus): string {
  return {
    NONE: "헌재 판단 없음",
    PENDING: "헌재 심리 중",
    CONSTITUTIONAL: "합헌",
    UNCONSTITUTIONAL: "위헌",
    NONCONFORMING: "헌법불합치",
    LIMITED_UNCONSTITUTIONAL: "한정위헌",
  }[s];
}

function FactRow({
  label,
  value,
  source,
  mono,
}: {
  label: string;
  value: string;
  source?: import("@/lib/types").OfficialSource;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
      <dt className="w-24 shrink-0 text-[0.8125rem] font-semibold text-faint">{label}</dt>
      <dd className={`min-w-0 flex-1 text-[0.9375rem] font-semibold ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
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

function ArgumentList({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)` }}>
      <h4 className="text-[0.8125rem] font-extrabold" style={{ color }}>
        {title}
      </h4>
      <ul className="mt-2 space-y-2">
        {items.map((t, i) => (
          <li key={i} className="flex gap-2 text-[0.875rem] leading-relaxed">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
