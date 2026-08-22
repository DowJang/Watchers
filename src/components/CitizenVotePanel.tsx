"use client";

import { useCallback, useEffect, useState } from "react";
import type { CitizenVoteTally } from "@/lib/types";
import { TRIGGER_THRESHOLD } from "@/lib/labels";
import { n, signed, dt } from "@/lib/format";
import { SITE } from "@/lib/site";
import {
  backendConfigured,
  castVote,
  loadBillOpinion,
  signInWithEmail,
  type Choice,
  type TriggerRecord,
} from "@/lib/citizen";

/**
 * 제작서 §8 — 시민 헌법의견투표.
 *
 * 백엔드가 연결되어 있으면 집계·중복방지·Trigger 판정이 전부 서버(Postgres 함수)에서 일어난다.
 * 브라우저는 결과만 받아 표시한다. 연결 전에는 로컬 데모로 동작하며 그 사실을 화면에 밝힌다.
 */
export function CitizenVotePanel({ billId, tally }: { billId: string; tally: CitizenVoteTally }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [live, setLive] = useState<{ unfit: number; fit: number } | null>(null);
  const [trigger, setTrigger] = useState<TriggerRecord | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoKey = `watchers:demo-vote:${billId}`;

  const refresh = useCallback(async () => {
    const result = await loadBillOpinion(billId);
    if (!result) return;
    setLive({ unfit: result.tally?.unfit ?? 0, fit: result.tally?.fit ?? 0 });
    setTrigger(result.trigger);
    setChoice(result.myChoice);
    setSignedIn(result.signedIn);
  }, [billId]);

  useEffect(() => {
    if (backendConfigured) {
      void refresh();
      return;
    }
    try {
      const saved = window.localStorage.getItem(demoKey);
      if (saved === "UNFIT" || saved === "FIT") setChoice(saved);
    } catch {
      /* localStorage 차단 환경 무시 */
    }
  }, [refresh, demoKey]);

  async function pick(next: Choice) {
    setError(null);

    if (!backendConfigured) {
      const value = choice === next ? null : next;
      setChoice(value);
      try {
        if (value) window.localStorage.setItem(demoKey, value);
        else window.localStorage.removeItem(demoKey);
      } catch {
        /* 무시 */
      }
      return;
    }

    if (!signedIn) {
      setError("투표하려면 먼저 로그인해 주세요.");
      return;
    }

    setBusy(true);
    try {
      const r = await castVote(billId, next);
      setLive({ unfit: r.unfit, fit: r.fit });
      setChoice(r.myChoice);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  // 표시 집계 — 백엔드가 있으면 서버 값, 없으면 예시 집계 + 내 표
  const unfit = live ? live.unfit : tally.unfit + (choice === "UNFIT" ? 1 : 0);
  const fit = live ? live.fit : tally.fit + (choice === "FIT" ? 1 : 0);
  const diff = unfit - fit;

  const triggeredAt = trigger?.triggeredAt ?? tally.triggeredAt;
  const snapshot = trigger
    ? {
        unfit: trigger.unfitVotes,
        fit: trigger.fitVotes,
        difference: trigger.difference,
        verifiedVoterCount: trigger.verifiedVoterCount,
      }
    : tally.triggerSnapshot;
  const triggered = Boolean(triggeredAt);
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
          disabled={busy}
          onClick={() => void pick("UNFIT")}
        />
        <VoteButton
          label="적합하다"
          dot="🟢"
          color="#1f8a5b"
          active={choice === "FIT"}
          disabled={busy}
          onClick={() => void pick("FIT")}
        />
      </div>

      {choice ? (
        <p className="mt-2 text-[0.8125rem] font-semibold" style={{ color: "var(--opinion-fg)" }}>
          현재 내 의견: {choice === "UNFIT" ? "🔴 부적합" : "🟢 적합"} — 다시 누르면 취소됩니다.
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-[0.8125rem] font-bold" style={{ color: "var(--color-lv-void)" }}>
          {error}
        </p>
      ) : null}

      {backendConfigured && !signedIn ? <SignInBox /> : null}

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

        {triggered && snapshot ? (
          <div
            className="mt-3 rounded-lg border px-3 py-2 text-[0.8125rem]"
            style={{ borderColor: "var(--opinion-bd)", background: "var(--surface)" }}
          >
            {/* §14 — Trigger 당시 Snapshot 과 현재 집계를 모두 보존·표시 */}
            <p className="font-bold">{triggeredAt ? dt(triggeredAt) : ""} 최초 1,000표 격차 도달</p>
            <p className="mt-0.5 text-dim tabular-nums">
              당시 집계 부적합 {n(snapshot.unfit)} / 적합 {n(snapshot.fit)} / 차이{" "}
              {signed(snapshot.difference)}
            </p>
            <p className="mt-0.5 text-dim tabular-nums">현재 차이 {signed(diff)}</p>
            {trigger?.correctionNote ? (
              <p className="mt-1 font-bold" style={{ color: "var(--color-lv-high)" }}>
                집계정정: {trigger.correctionNote}
              </p>
            ) : null}
            <p className="mt-1.5 text-xs text-faint">
              1,000표 격차는 위헌 판정이 아니라, 헌재 제출 요건 검토절차를 시작하는 기준입니다.
            </p>
          </div>
        ) : null}
      </div>

      <p className="mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: "var(--surface-2)" }}>
        {backendConfigured ? (
          <>
            <strong className="font-bold">집계 방식</strong> — 한 계정은 법안당 한 표만 가지며, 투표를
            바꾸면 이전 표는 무효가 되고 변경 이력이 남습니다. 이름·전화번호 등 개인 식별정보는 투표
            결과에 노출되지 않습니다. 다만 <strong className="font-bold">본인확인은 아직 연결되지
            않았습니다</strong> — 현재 집계는 “인증된 1인 1표”가 아니라 “이메일 계정 1개당 1표”이며,
            1,000표 Trigger 도 이 기준으로 계산됩니다.
          </>
        ) : (
          <>
            <strong className="font-bold">데모 안내</strong> — 현재 이 투표는 브라우저에만 저장되는
            시연용입니다. 실제 서비스에서는 본인확인 기반 1인 1표, 중복·자동화 투표 방지, 감사로그가
            서버에서 적용됩니다.
          </>
        )}
      </p>
    </div>
  );
}

function SignInBox() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "보내지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p
        className="mt-3 rounded-lg border px-3 py-2 text-[0.8125rem]"
        style={{ borderColor: "var(--opinion-bd)", background: "var(--surface)" }}
      >
        로그인 링크를 보냈습니다. 메일함을 확인해 주세요.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 rounded-lg border px-3 py-3"
      style={{ borderColor: "var(--opinion-bd)", background: "var(--surface)" }}
    >
      <label htmlFor="vote-email" className="text-[0.8125rem] font-bold">
        투표하려면 이메일로 로그인해 주세요
      </label>
      <p className="mt-0.5 text-[0.75rem] leading-relaxed text-faint">
        비밀번호를 만들지 않습니다. 일회용 로그인 링크만 보냅니다.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          id="vote-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="surface min-w-0 flex-1 rounded-lg px-3 py-2 text-[0.875rem] outline-none"
          style={{ borderColor: "var(--border-strong)" }}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg px-3 py-2 text-[0.875rem] font-bold disabled:opacity-50"
          style={{ background: "var(--color-opinion)", color: "#fff" }}
        >
          {busy ? "전송 중…" : "링크 받기"}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-[0.75rem] font-bold" style={{ color: "var(--color-lv-void)" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}

function VoteButton({
  label,
  dot,
  color,
  active,
  disabled,
  onClick,
}: {
  label: string;
  dot: string;
  color: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-[0.9375rem] font-extrabold transition-colors disabled:opacity-60"
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
