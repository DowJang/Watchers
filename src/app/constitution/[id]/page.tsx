import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticle } from "@/data/constitution";
import { FactZone } from "@/components/Zone";

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

        <FactZone title="쉬운 설명" note="평가나 특정 법안과의 충돌 판단을 담지 않은 일반적 설명입니다.">
          <p className="text-[1rem] leading-relaxed">{a.plain}</p>
        </FactZone>

        <p className="text-[0.8125rem] leading-relaxed text-dim">
          특정 법안이 이 조항과 어떤 관계에 있는지에 대한 감시자들의 판단은 제공하지 않습니다. 각
          법안이 위헌인지 여부는{" "}
          <Link href="/bills" className="font-bold underline">
            법안 목록
          </Link>
          에서 헌법재판소의 공식 결정만으로 확인하실 수 있습니다.
        </p>
      </div>
    </>
  );
}
