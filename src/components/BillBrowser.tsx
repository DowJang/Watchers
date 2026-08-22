"use client";

import { useMemo, useState } from "react";
import type { Bill, BillStatus, ConflictLevel } from "@/lib/types";
import { conflictMeta, conflictOrder, statusLabel, statusOrder } from "@/lib/labels";
import { BillCard } from "./BillCard";
import { getLegislator, getParty } from "@/data/people";

type Sort = "gravity" | "recent" | "opinion";

const sortLabel: Record<Sort, string> = {
  gravity: "충돌등급 높은 순",
  recent: "최근 발의 순",
  opinion: "시민의견 격차 순",
};

const levelRank = new Map(conflictOrder.map((l, i) => [l, i]));

export function BillBrowser({
  bills,
  initialLevel,
  initialStatus,
  initialSort,
}: {
  bills: Bill[];
  initialLevel?: ConflictLevel;
  initialStatus?: BillStatus;
  initialSort?: Sort;
}) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<ConflictLevel | "ALL">(initialLevel ?? "ALL");
  const [status, setStatus] = useState<BillStatus | "ALL">(initialStatus ?? "ALL");
  const [sort, setSort] = useState<Sort>(initialSort ?? "gravity");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = bills.filter((b) => {
      if (level !== "ALL" && b.analysis.conflictLevel !== level) return false;
      if (status !== "ALL" && b.fact.status !== status) return false;
      if (!needle) return true;
      const sponsor = b.fact.proposal.sponsorId ? getLegislator(b.fact.proposal.sponsorId) : undefined;
      const party = sponsor ? getParty(sponsor.partyId).name : "";
      const hay = [
        b.fact.title,
        b.fact.billNo,
        b.fact.committee,
        b.analysis.whatItIs,
        b.analysis.coreIssue,
        ...b.analysis.keywords,
        sponsor?.name ?? "",
        party,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });

    out = [...out].sort((a, b) => {
      if (sort === "recent") return b.fact.proposal.proposedAt.localeCompare(a.fact.proposal.proposedAt);
      if (sort === "opinion") {
        const ga = a.opinion.unfit - a.opinion.fit;
        const gb = b.opinion.unfit - b.opinion.fit;
        return gb - ga;
      }
      const la = levelRank.get(a.analysis.conflictLevel) ?? 99;
      const lb = levelRank.get(b.analysis.conflictLevel) ?? 99;
      if (la !== lb) return la - lb;
      return b.fact.proposal.proposedAt.localeCompare(a.fact.proposal.proposedAt);
    });

    return out;
  }, [bills, q, level, status, sort]);

  const filtered = level !== "ALL" || status !== "ALL" || q.trim().length > 0;

  return (
    <>
      {/* 검색 */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-3)"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="법안명, 의안번호, 발의자, 키워드 검색"
          aria-label="법안 검색"
          className="surface w-full rounded-xl py-3 pl-10 pr-3 text-[0.9375rem] outline-none"
          style={{ borderColor: "var(--border-strong)" }}
        />
      </div>

      {/* 필터: 모바일에서는 가로 스크롤 칩 */}
      <FilterRow label="충돌등급">
        <Chip active={level === "ALL"} onClick={() => setLevel("ALL")}>
          전체
        </Chip>
        {conflictOrder.map((lv) => (
          <Chip key={lv} active={level === lv} onClick={() => setLevel(lv)} color={conflictMeta[lv].cssVar}>
            {conflictMeta[lv].short}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="현재 상태">
        <Chip active={status === "ALL"} onClick={() => setStatus("ALL")}>
          전체
        </Chip>
        {statusOrder.map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {statusLabel[s]}
          </Chip>
        ))}
      </FilterRow>

      <FilterRow label="정렬">
        {(Object.keys(sortLabel) as Sort[]).map((s) => (
          <Chip key={s} active={sort === s} onClick={() => setSort(s)}>
            {sortLabel[s]}
          </Chip>
        ))}
      </FilterRow>

      <div className="mt-4 flex items-center gap-2">
        <p className="text-[0.8125rem] font-semibold text-dim">
          {list.length}건{filtered ? ` (전체 ${bills.length}건 중)` : ""}
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setLevel("ALL");
              setStatus("ALL");
            }}
            className="text-[0.8125rem] font-bold underline"
            style={{ color: "var(--text-3)" }}
          >
            필터 초기화
          </button>
        ) : null}
      </div>

      {list.length === 0 ? (
        <p className="surface mt-3 rounded-2xl p-8 text-center text-sm text-dim">
          조건에 맞는 법안이 없습니다.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <BillCard key={b.id} bill={b} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[0.6875rem] font-bold text-faint">{label}</p>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {children}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="shrink-0 rounded-full border px-3 py-1.5 text-[0.8125rem] font-bold transition-colors"
      style={
        active
          ? {
              background: color ?? "var(--color-fact)",
              borderColor: color ?? "var(--color-fact)",
              color: "#fff",
            }
          : { background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text-2)" }
      }
    >
      {children}
    </button>
  );
}
