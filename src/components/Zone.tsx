import type { ReactNode } from "react";

/**
 * 제작서 §3 — FACT / ANALYSIS / USER OPINION 완전 분리.
 * 세 영역은 색·테두리·머리표시가 모두 달라야 하며,
 * 사용자가 화면만 보고도 "이건 공식 기록인가, 해석인가, 의견인가"를 구분할 수 있어야 한다.
 */

type Props = {
  title: string;
  children: ReactNode;
  note?: ReactNode;
  id?: string;
  action?: ReactNode;
};

export function FactZone({ title, children, note, id, action }: Props) {
  return (
    <section id={id} className="zone zone-fact">
      <header className="zone-head">
        <Tag>공식 기록 · FACT</Tag>
        <h2 className="text-sm font-bold tracking-normal">{title}</h2>
        {action ? <div className="ml-auto">{action}</div> : null}
      </header>
      <div className="zone-body">{children}</div>
      {note ? (
        <p
          className="border-t px-3.5 py-2 text-xs"
          style={{ color: "var(--fact-fg)", borderColor: "var(--fact-bd)", background: "var(--fact-bg)" }}
        >
          {note}
        </p>
      ) : null}
    </section>
  );
}

export function AnalysisZone({ title, children, note, id, action }: Props) {
  return (
    <section id={id} className="zone zone-analysis">
      <header className="zone-head">
        <Tag>감시자들 분석 · ANALYSIS</Tag>
        <h2 className="text-sm font-bold tracking-normal">{title}</h2>
        {action ? <div className="ml-auto">{action}</div> : null}
      </header>
      <div className="zone-body">{children}</div>
      <p
        className="border-t border-dashed px-3.5 py-2 text-xs"
        style={{
          color: "var(--analysis-fg)",
          borderColor: "var(--analysis-bd)",
          background: "var(--analysis-bg)",
        }}
      >
        {note ?? "감시자들의 법률적 설명이며, 국가기관의 공식 판단이 아닙니다."}
      </p>
    </section>
  );
}

export function OpinionZone({ title, children, note, id, action }: Props) {
  return (
    <section id={id} className="zone zone-opinion">
      <header className="zone-head">
        <Tag>시민 의견 · OPINION</Tag>
        <h2 className="text-sm font-bold tracking-normal">{title}</h2>
        {action ? <div className="ml-auto">{action}</div> : null}
      </header>
      <div className="zone-body">{children}</div>
      <p
        className="border-t px-3.5 py-2 text-xs font-semibold"
        style={{
          color: "var(--opinion-fg)",
          borderColor: "var(--opinion-bd)",
          background: "var(--opinion-bg)",
        }}
      >
        {note ?? "시민 의견 — 대한민국 국가기관의 공식 기록이 아닙니다."}
      </p>
    </section>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      className="shrink-0 rounded-md px-1.5 py-0.5 text-[0.625rem] font-extrabold"
      style={{ background: "color-mix(in srgb, currentColor 14%, transparent)" }}
    >
      {children}
    </span>
  );
}
