"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bill, BillStatus, CourtStatus } from "@/lib/types";
import { courtLabel, courtStatusOrder, statusLabel, statusOrder } from "@/lib/labels";
import { BillCard } from "./BillCard";
import { getLegislator, getParty, summaryOf } from "@/lib/repo";

type Sort = "court" | "recent" | "opinion";

const sortLabel: Record<Sort, string> = {
  court: "헌재 결정 있는 순",
  recent: "최근 발의 순",
  opinion: "시민의견 격차 순",
};

const courtRank = new Map(courtStatusOrder.map((s, i) => [s, i]));

export function BillBrowser({ bills }: { bills: Bill[] }) {
  const [q, setQ] = useState("");
  const [court, setCourt] = useState<CourtStatus | "ALL">("ALL");
  const [status, setStatus] = useState<BillStatus | "ALL">("ALL");
  const [sort, setSort] = useState<Sort>("court");

  /**
   * 정적 사이트이므로 초기 필터는 브라우저에서 쿼리스트링을 읽어 적용한다.
   * 예: /bills/?court=UNCONSTITUTIONAL  (홈 화면의 "전체 보기" 링크)
   */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const ct = sp.get("court");
    const st = sp.get("status");
    const so = sp.get("sort");
    if (ct && (courtStatusOrder as string[]).includes(ct)) setCourt(ct as CourtStatus);
    if (st && (statusOrder as string[]).includes(st)) setStatus(st as BillStatus);
    if (so === "recent" || so === "opinion" || so === "court") setSort(so);
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = bills.filter((b) => {
      if (court !== "ALL" && b.fact.courtStatus !== court) return false;
      if (status !== "ALL" && b.fact.status !== status) return false;
      if (!needle) return true;
      const sponsor = b.fact.proposal.sponsorId ? getLegislator(b.fact.proposal.sponsorId) : undefined;
      const party = sponsor ? getParty(sponsor.partyId).name : "";
      const hay = [b.fact.title, b.fact.billNo, b.fact.committee, summaryOf(b).whatItIs, sponsor?.name ?? "", party]
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
      const la = courtRank.get(a.fact.courtStatus) ?? 99;
      const lb = courtRank.get(b.fact.courtStatus) ?? 99;
      if (la !== lb) return la - lb;
      return b.fact.proposal.proposedAt.localeCompare(a.fact.proposal.proposedAt);
    });

    return out;
  }, [bills, q, court, status, sort]);

  const filtered = court !== "ALL" || status !== "ALL" || q.trim().length > 0;

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
          placeholder="법안명, 의안번호, 발의자 검색"
          aria-label="법안 검색"
          className="surface w-full rounded-xl py-3 pl-10 pr-3 text-[0.9375rem] outline-none"
          style={{ borderColor: "var(--border-strong)" }}
        />
      </div>

      {/* 필터: 모바일에서는 가로 스크롤 칩 */}
      <FilterRow label="헌재 판단">
        <Chip active={court === "ALL"} onClick={() => setCourt("ALL")}>
          전체
        </Chip>
        {courtStatusOrder.map((c) => (
          <Chip key={c} active={court === c} onClick={() => setCourt(c)}>
            {courtLabel[c]}
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
              setCourt("ALL");
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
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="shrink-0 rounded-full border px-3 py-1.5 text-[0.8125rem] font-bold transition-colors"
      style={
        active
          ? { background: "var(--color-fact)", borderColor: "var(--color-fact)", color: "#fff" }
          : { background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text-2)" }
      }
    >
      {children}
    </button>
  );
}
