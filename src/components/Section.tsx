import Link from "next/link";
import type { ReactNode } from "react";

export function Section({
  title,
  desc,
  more,
  moreLabel = "전체 보기",
  children,
}: {
  title: string;
  desc?: string;
  more?: string;
  moreLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <div className="mb-3 flex items-end gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{title}</h2>
          {desc ? <p className="mt-0.5 text-[0.8125rem] text-dim">{desc}</p> : null}
        </div>
        {more ? (
          <Link
            href={more}
            className="ml-auto shrink-0 text-[0.8125rem] font-bold"
            style={{ color: "var(--text-2)" }}
          >
            {moreLabel} →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** 모바일 1열 → 태블릿 2열 → 데스크톱 3열 */
export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
