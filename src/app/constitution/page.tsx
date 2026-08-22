import type { Metadata } from "next";
import Link from "next/link";
import { articles, principles } from "@/data/constitution";

export const metadata: Metadata = {
  title: "헌법",
  description: "대한민국헌법 조항의 공식 원문과 쉬운 설명을 확인합니다.",
};

export default function ConstitutionPage() {
  return (
    <>
      <header className="pb-1 pt-2">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">헌법</h1>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-dim">
          대한민국헌법 조항의 공식 원문과 쉬운 설명입니다. 특정 법안이 어느 조항과 충돌하는지에
          대한 감시자들의 판단은 제공하지 않습니다 — 위헌 여부는 헌법재판소의 공식 결정만
          다룹니다.
        </p>
      </header>

      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {articles.map((a) => (
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
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold tracking-tight md:text-xl">헌법상 핵심 원칙</h2>
        <p className="mt-0.5 text-[0.8125rem] text-dim">
          헌법 해석에서 반복해서 등장하는 일반 개념에 대한 사전적 설명입니다.
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
