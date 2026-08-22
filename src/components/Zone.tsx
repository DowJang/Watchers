import type { ReactNode } from "react";

/**
 * FACT / 쉬운 요약 / USER OPINION 완전 분리.
 * 세 영역은 색·테두리·머리표시가 모두 달라야 하며,
 * 사용자가 화면만 보고도 "이건 공식 기록인가, 쉬운 말로 옮긴 것인가, 시민 의견인가"를
 * 구분할 수 있어야 한다.
 *
 * "쉬운 요약"(SummaryZone)은 감시자들의 법률적 의견·판단이 아니다 — 위헌 여부에 대한
 * 판단은 오직 헌법재판소의 공식 결정(FACT)만 사용하며, 이 사이트는 그 외의 헌법적
 * 논거·등급을 만들지 않는다.
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

/**
 * 쉬운 요약 영역.
 * 공식 기록(법안명·제안이유)을 평가·해석 없이 쉬운 말로 옮긴 것일 뿐,
 * 헌법적 판단·논거·등급은 담지 않는다. 위헌 여부는 항상 FactZone 의 헌재 결정만 본다.
 */
export function SummaryZone({ title, children, note, id, action }: Props) {
  return (
    <section id={id} className="zone zone-analysis">
      <header className="zone-head">
        <Tag>쉬운 요약</Tag>
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
        {note ?? "공식 기록을 평가 없이 쉬운 말로 옮긴 것입니다. 헌법 판단이 아닙니다."}
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
