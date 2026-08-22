import type { ReactNode } from "react";
import { backendConfigured } from "@/lib/supabase";

export function Panel({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface rounded-2xl">
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-extrabold">{title}</h2>
          {desc ? <p className="mt-0.5 text-[0.75rem] text-faint">{desc}</p> : null}
        </div>
        {action ? <div className="ml-auto">{action}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "warn" | "alert" | "good";
}) {
  const color = {
    neutral: "var(--text)",
    good: "#1f8a5b",
    warn: "#b98400",
    alert: "#c0182b",
  }[tone];
  return (
    <div className="surface rounded-xl px-3 py-3">
      <p className="text-[0.75rem] leading-tight text-faint">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums" style={{ color }}>
        {typeof value === "number" ? value.toLocaleString("ko-KR") : value}
      </p>
      {hint ? <p className="mt-0.5 text-[0.6875rem] leading-tight text-faint">{hint}</p> : null}
    </div>
  );
}

/** 가로 스크롤이 필요한 표를 감싼다 — 모바일에서 페이지 전체가 밀리지 않게. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[36rem] border-collapse text-[0.8125rem]">{children}</table>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-dim">{children}</p>;
}

/**
 * 실시간 데이터가 필요한 영역.
 * 백엔드가 없으면 "없는 값을 지어내지 않고" 그 사실만 표시한다.
 */
export function LiveOnly({ what, children }: { what: string; children?: ReactNode }) {
  if (backendConfigured) return <>{children}</>;
  return (
    <div
      className="rounded-xl border border-dashed px-4 py-6 text-center"
      style={{ borderColor: "var(--border-strong)" }}
    >
      <p className="text-sm font-bold text-dim">{what}</p>
      <p className="mt-1 text-[0.8125rem] text-faint">
        시민 참여 백엔드를 연결하면 이 자리에 실시간 값이 표시됩니다.
      </p>
    </div>
  );
}
