import type { Metadata } from "next";
import Link from "next/link";
import { articles, principles } from "@/data/constitution";
import { billsByArticle } from "@/lib/site";
import { n } from "@/lib/format";
import { ConflictBadge } from "@/components/Badges";

export const metadata: Metadata = {
  title: "헌법",
  description: "헌법 조항별로 관련 법안을 모아 봅니다.",
};

export default function ConstitutionPage() {
  return (
    <>
      <header className="pb-1 pt-2">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">헌법</h1>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-dim">
          헌법 조항의 공식 원문과 쉬운 설명을 나란히 보고, 그 조항과 맞닿은 법안을 확인할 수 있습니다.
        </p>
      </header>

      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {articles.map((a) => {
          const related = billsByArticle(a.id);
          return (
            <li key={a.id}>
              <Link
                href={`/constitution/${a.id}`}
                className="surface flex h-full flex-col rounded-2xl p-4 transition-shadow hover:shadow-md"
              >
                <p className="text-[0.8125rem] font-bold" style={{ color: "var(--fact-fg)" }}>
                  {a.no}
                </p>
                <h2 className="text-[1.0625rem] font-extrabold leading-snug">{a.title}</h2>
                <blockquote className="quote-const mt-2 text-[0.875rem]">{a.text}</blockquote>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-dim">{a.plain}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                  <span className="text-[0.8125rem] font-bold text-faint">
                    관련 법안 {n(related.length)}건
                  </span>
                  <span className="ml-auto flex flex-wrap gap-1">
                    {related.slice(0, 3).map((b) => (
                      <ConflictBadge key={b.id} level={b.analysis.conflictLevel} size="sm" />
                    ))}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold tracking-tight md:text-xl">헌법상 핵심 원칙</h2>
        <p className="mt-0.5 text-[0.8125rem] text-dim">
          법안이 헌법과 부딪히는 지점을 설명할 때 반복해서 등장하는 개념입니다.
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <li key={p.id} className="surface rounded-xl p-3">
              <p className="text-[0.9375rem] font-extrabold">{p.term}</p>
              <p className="mt-0.5 text-[0.875rem] leading-relaxed text-dim">→ {p.plain}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
