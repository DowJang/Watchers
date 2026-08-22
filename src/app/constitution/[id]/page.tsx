import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle } from "@/data/constitution";
import { billsByArticle } from "@/lib/site";
import { BillCard } from "@/components/BillCard";
import { FactZone, AnalysisZone } from "@/components/Zone";
import { n } from "@/lib/format";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return articles.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const a = getArticle(id);
  if (!a) return { title: "헌법 조항을 찾을 수 없습니다" };
  return { title: `헌법 ${a.no} ${a.title}`, description: a.plain };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { id } = await params;
  const a = getArticle(id);
  if (!a) notFound();

  const related = billsByArticle(a.id);

  return (
    <>
      <nav className="pt-2 text-[0.8125rem] font-semibold text-faint">
        <Link href="/constitution">헌법</Link> <span aria-hidden>›</span> <span>{a.no}</span>
      </nav>

      <header className="mt-2">
        <p className="text-[0.9375rem] font-bold" style={{ color: "var(--fact-fg)" }}>
          대한민국헌법 {a.no}
        </p>
        <h1 className="mt-0.5 text-2xl font-black tracking-tight md:text-3xl">{a.title}</h1>
      </header>

      <div className="mt-5 space-y-5">
        <FactZone title="헌법 원문" note="대한민국헌법 조문. 국가법령정보센터가 공개하는 공식 기록입니다.">
          <blockquote className="quote-const text-[1.0625rem] leading-relaxed">{a.text}</blockquote>
        </FactZone>

        <AnalysisZone title="쉬운 설명">
          <p className="text-[1rem] leading-relaxed">{a.plain}</p>
        </AnalysisZone>

        <section>
          <h2 className="mb-3 text-lg font-extrabold tracking-tight md:text-xl">
            이 조항과 맞닿은 법안 {n(related.length)}건
          </h2>
          {related.length === 0 ? (
            <p className="surface rounded-2xl p-8 text-center text-sm text-dim">
              현재 이 조항과 연결된 법안이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((b) => (
                <BillCard key={b.id} bill={b} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
