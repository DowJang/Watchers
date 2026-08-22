"use client";

import { useEffect, useState } from "react";
import type { CitizenVoteTally } from "@/lib/types";
import { TRIGGER_THRESHOLD } from "@/lib/labels";
import { n, signed, dt } from "@/lib/format";
import { SITE } from "@/lib/site";

type Choice = "UNFIT" | "FIT";

/**
 * 제작서 §8 — 시민 헌법의견투표.
 *
 * ⚠️ 현재는 프런트 데모다. 실제 집계·중복방지는 서버에서 처리해야 한다(§9).
 *   - 1인 1법안 1표 / 본인확인 기반 인증 투표
 *   - 식별값은 원본 저장 없이 변환·보관, 주민등록번호 미수집
 *   - 투표 변경 가능하되 활성표는 1개, 모든 변경은 감사로그 기록
 * 이 컴포넌트는 그 서버 API가 붙기 전까지 UI 계약(입력·표시)만 확정해 둔다.
 */
export function CitizenVotePanel({ billId, tally }: { billId: string; tally: CitizenVoteTally }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const key = `watchers:demo-vote:${billId}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved === "UNFIT" || saved === "FIT") setChoice(saved);
    } catch {
      /* localStorage 차단 환경 무시 */
    }
  }, [key]);

  function pick(next: Choice) {
    const value = choice === next ? null : next;
    setChoice(value);
    try {
      if (value) window.localStorage.setItem(key, value);
      else window.localStorage.removeItem(key);
    } catch {
      /* 무시 */
    }
  }

  // 데모 표시용 집계 — 내 표를 더해서 보여준다. 서버 집계로 교체 대상.
  const unfit = tally.unfit + (choice === "UNFIT" ? 1 : 0);
  const fit = tally.fit + (choice === "FIT" ? 1 : 0);
  const diff = unfit - fit;
  const triggered = Boolean(tally.triggeredAt);
  const progress = Math.min(100, Math.max(0, Math.round((diff / TRIGGER_THRESHOLD) * 100)));

  return (
    <div>
      <p className="text-[0.9375rem] font-bold leading-snug">{SITE.voteQuestion}</p>
      <p className="mt-1 text-[0.8125rem] text-dim">{SITE.participation}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <VoteButton
          label="부적합하다"
          dot="🔴"
          color="#c0182b"
          active={choice === "UNFIT"}
          onClick={() => pick("UNFIT")}
        />
        <VoteButton
          label="적합하다"
          dot="🟢"
          color="#1f8a5b"
          active={choice === "FIT"}
          onClick={() => pick("FIT")}
        />
      </div>

      {choice ? (
        <p className="mt-2 text-[0.8125rem] font-semibold" style={{ color: "var(--opinion-fg)" }}>
          현재 내 의견: {choice === "UNFIT" ? "🔴 부적합" : "🟢 적합"} — 다시 누르면 취소됩니다.
        </p>
      ) : null}

      {/* 집계 */}
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="부적합" value={n(unfit)} color="#c0182b" />
        <Stat label="적합" value={n(fit)} color="#1f8a5b" />
        <Stat label="차이" value={signed(diff)} color="var(--text)" />
      </dl>

      {/* 1,000표 Trigger 진행 (§10) */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[0.75rem] font-bold">
          <span className="text-dim">1,000표 격차 Trigger</span>
          <span className="tabular-nums text-faint">
            {triggered
              ? "도달"
              : diff > 0
                ? `${n(TRIGGER_THRESHOLD - diff)}표 남음`
                : "부적합 우세 아님"}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full transition-[width]"
            style={{
              width: `${triggered ? 100 : progress}%`,
              background: triggered ? "var(--color-lv-void)" : "var(--color-lv-high)",
            }}
          />
        </div>

        {triggered && tally.triggerSnapshot ? (
          <div
            className="mt-3 rounded-lg border px-3 py-2 text-[0.8125rem]"
            style={{ borderColor: "var(--opinion-bd)", background: "var(--surface)" }}
          >
            {/* §14 — Trigger 당시 Snapshot 과 현재 집계를 모두 보존·표시 */}
            <p className="font-bold">
              {dt(tally.triggeredAt!)} 최초 1,000표 격차 도달
            </p>
            <p className="mt-0.5 text-dim tabular-nums">
              당시 집계 부적합 {n(tally.triggerSnapshot.unfit)} / 적합 {n(tally.triggerSnapshot.fit)} / 차이{" "}
              {signed(tally.triggerSnapshot.difference)}
            </p>
            <p className="mt-0.5 text-dim tabular-nums">현재 차이 {signed(diff)}</p>
            <p className="mt-1.5 text-xs text-faint">
              1,000표 격차는 위헌 판정이 아니라, 헌재 제출 요건 검토절차를 시작하는 기준입니다.
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: "var(--surface-2)" }}>
        <strong className="font-bold">데모 안내</strong> — 현재 이 투표는 브라우저에만 저장되는 시연용입니다.
        실제 서비스에서는 본인확인 기반 1인 1표, 중복·자동화 투표 방지, 감사로그가 서버에서 적용됩니다.
      </p>
    </div>
  );
}

function VoteButton({
  label,
  dot,
  color,
  active,
  onClick,
}: {
  label: string;
  dot: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-[0.9375rem] font-extrabold transition-colors"
      style={{
        borderColor: color,
        background: active ? color : "var(--surface)",
        color: active ? "#fff" : color,
      }}
    >
      <span aria-hidden>{dot}</span>
      {label}
    </button>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl px-2 py-2.5" style={{ background: "var(--surface)" }}>
      <dt className="text-[0.75rem] text-faint">{label}</dt>
      <dd className="text-lg font-black tabular-nums" style={{ color }}>
        {value}
      </dd>
    </div>
  );
}
