import Link from "next/link";
import { BillCard } from "@/components/BillCard";
import { CardGrid, Section } from "@/components/Section";
import { CourtPill } from "@/components/Badges";
import { OpinionZone } from "@/components/Zone";
import { TRIGGER_THRESHOLD } from "@/lib/labels";
import { n, signed } from "@/lib/format";
import { SITE, courtRuledBills, gap, inForceBills, isTriggered, newBills, siteMeta, topOpinionBills } from "@/lib/site";

export default function HomePage() {
  const t = siteMeta.today;
  const changes: Array<[string, number]> = [
    ["신규 헌법쟁점 법안", t.newBills],
    ["위원회 통과", t.committeePassed],
    ["본회의 가결", t.plenaryPassed],
    ["공포", t.promulgated],
    ["시행", t.inForce],
    ["헌재 결정", t.courtDecisions],
  ];

  return (
    <>
      {/* ── 히어로 ── */}
      <section className="pb-2 pt-2 md:pt-6">
        <h1 className="text-[1.5rem] font-black leading-tight tracking-tight md:text-4xl">
          누가, 왜 이 법을 만들었고
          <br />
          <span style={{ color: "var(--fact-fg)" }}>헌법과 어디에서 충돌하는가.</span>
        </h1>
        <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-dim md:text-base">
          {SITE.description} 위헌 여부는 헌법재판소의 공식 결정만 다루며, 감시자들 자체의 헌법적
          판단이나 논거는 제공하지 않습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/bills"
            className="rounded-xl px-4 py-2.5 text-sm font-bold"
            style={{ background: "var(--color-fact)", color: "#fff" }}
          >
            법안 전체 보기
          </Link>
          <Link
            href="/transparency"
            className="surface rounded-xl px-4 py-2.5 text-sm font-bold"
            style={{ borderColor: "var(--border-strong)" }}
          >
            데이터 출처·기준
          </Link>
        </div>
      </section>

      {/* ── 오늘의 입법 ── */}
      <Section title="오늘의 입법" desc="전일 대비 국가기관 공식기록 변경">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {changes.map(([label, value]) => (
            <div
              key={label}
              className="surface rounded-xl px-3 py-3"
              style={{ borderColor: value > 0 ? "var(--fact-bd)" : "var(--border)" }}
            >
              <p className="text-[0.75rem] leading-tight text-faint">{label}</p>
              <p
                className="mt-1 text-xl font-black tabular-nums"
                style={{ color: value > 0 ? "var(--fact-fg)" : "var(--text-3)" }}
              >
                {value > 0 ? `+${value}` : "0"}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 헌법재판소 판단이 있는 법안 ── */}
      <Section
        title="헌법재판소 판단이 있는 법안"
        desc="위헌·헌법불합치·한정위헌·심리 중 등 공식 결정이 있는 법안입니다."
        more="/bills/?sort=court"
      >
        <CardGrid>
          {courtRuledBills(3).map((b) => (
            <BillCard key={b.id} bill={b} />
          ))}
        </CardGrid>
        {courtRuledBills(1).length === 0 ? (
          <p className="surface rounded-2xl p-6 text-center text-sm text-dim">
            현재 헌법재판소 판단이 있는 법안이 없습니다.
          </p>
        ) : null}
      </Section>

      {/* ── 신규 법안 ── */}
      <Section title="신규 법안" desc="최근 발의된 순서입니다." more="/bills/?sort=recent">
        <CardGrid>
          {newBills(3).map((b) => (
            <BillCard key={b.id} bill={b} />
          ))}
        </CardGrid>
      </Section>

      {/* ── 현재 시행 법률 ── */}
      <Section title="현재 시행 법률 · 시행 예정" more="/bills/?status=IN_FORCE">
        <CardGrid>
          {inForceBills(3).map((b) => (
            <BillCard key={b.id} bill={b} />
          ))}
        </CardGrid>
      </Section>

      {/* ── 오늘의 시민의견 ── */}
      <Section title="오늘의 시민의견" desc={SITE.participation}>
        <OpinionZone title="부적합 · 적합 의견 격차">
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {topOpinionBills(4).map((b) => {
              const g = gap(b);
              const triggered = isTriggered(b);
              const progress = Math.min(100, Math.round((Math.max(0, g) / TRIGGER_THRESHOLD) * 100));
              return (
                <li key={b.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/bills/${b.id}`} className="block">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold leading-snug">{b.fact.title}</p>
                      {b.fact.courtStatus !== "NONE" ? <CourtPill status={b.fact.courtStatus} /> : null}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] tabular-nums">
                      <span style={{ color: "var(--color-lv-void)" }}>부적합 {n(b.opinion.unfit)}</span>
                      <span style={{ color: "#1f8a5b" }}>적합 {n(b.opinion.fit)}</span>
                      <span className="font-bold">차이 {signed(g)}</span>
                      {triggered ? (
                        <span
                          className="rounded px-1.5 py-0.5 text-[0.6875rem] font-extrabold"
                          style={{ background: "var(--color-lv-void)", color: "#fff" }}
                        >
                          1,000표 격차 도달
                        </span>
                      ) : g > 0 ? (
                        <span className="text-faint">Trigger까지 {n(TRIGGER_THRESHOLD - g)}표</span>
                      ) : null}
                    </div>
                    {!triggered && g > 0 ? (
                      <div
                        className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                        style={{ background: "var(--surface-2)" }}
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${progress}%`, background: "var(--color-lv-high)" }}
                        />
                      </div>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </OpinionZone>
      </Section>
    </>
  );
}
