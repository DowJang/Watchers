import type { BillEvent } from "@/lib/types";
import { d } from "@/lib/format";
import { SourceLink } from "./Badges";

/** 제작서 §5.3 — 입법 진행경과. 모든 단계는 국가기관 공식 기록과 연결한다. */
export function Timeline({ events }: { events: BillEvent[] }) {
  return (
    <ol className="relative">
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <li key={`${e.date}-${e.label}`} className="relative flex gap-3 pb-4 last:pb-0">
            {/* 세로선 */}
            {!last ? (
              <span
                aria-hidden
                className="absolute left-[0.3125rem] top-3 h-full w-px"
                style={{ background: "var(--border-strong)" }}
              />
            ) : null}
            <span
              aria-hidden
              className="relative mt-1.5 size-2.5 shrink-0 rounded-full ring-2"
              style={{
                background: last ? "var(--color-fact)" : "var(--surface)",
                borderColor: "var(--fact-bd)",
                boxShadow: `0 0 0 2px var(--surface)`,
                outline: `2px solid ${last ? "var(--color-fact)" : "var(--border-strong)"}`,
                outlineOffset: "-2px",
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <time className="font-mono text-[0.8125rem] font-bold tabular-nums" dateTime={e.date}>
                  {d(e.date)}
                </time>
                <span className="text-[0.9375rem] font-bold">{e.label}</span>
                {e.source ? <SourceLink source={e.source} compact /> : null}
              </div>
              {e.detail ? <p className="mt-0.5 text-[0.8125rem] text-dim">{e.detail}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
