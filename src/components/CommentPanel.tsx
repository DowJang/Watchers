"use client";

import { useMemo, useState } from "react";
import type { CitizenComment } from "@/lib/types";
import { dt } from "@/lib/format";

const MAX_CHARS = 240;
const MAX_LINES = 3;

/**
 * 제작서 §15 — 시민 코멘트.
 * 최소 1줄 / 최대 3줄 / 권장 240자, 빈 댓글·도배 금지.
 * ⚠️ 현재는 프런트 데모다. 실제로는 인증 사용자만 작성 가능(권장 기본값: 투표 완료자)하며
 * 서버에서 스팸·도배 판정과 Audit Log 기록을 수행한다(§16, §23).
 */
export function CommentPanel({ initial }: { initial: CitizenComment[] }) {
  const [items, setItems] = useState<CitizenComment[]>(initial);
  const [text, setText] = useState("");

  const lines = useMemo(() => text.split("\n").filter((l) => l.trim().length > 0).length, [text]);
  const tooLong = text.length > MAX_CHARS;
  const tooManyLines = lines > MAX_LINES;
  const empty = text.trim().length === 0;
  const duplicate = items.some((c) => c.body.trim() === text.trim() && text.trim().length > 0);
  const invalid = empty || tooLong || tooManyLines || duplicate;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    setItems((prev) => [
      {
        id: `local-${prev.length + 1}`,
        billId: initial[0]?.billId ?? "",
        handle: "나 (미인증)",
        body: text.trim(),
        createdAt: new Date().toISOString().replace("Z", "+00:00"),
        status: "VISIBLE",
      },
      ...prev,
    ]);
    setText("");
  }

  return (
    <div>
      <p className="text-[0.8125rem] leading-relaxed" style={{ color: "var(--opinion-fg)" }}>
        아래 의견은 방문자가 작성한 내용이며 대한민국 국가기관의 공식 기록이나 감시자들의 법률적 판단이
        아닙니다.
      </p>

      <form onSubmit={submit} className="mt-3">
        <label htmlFor="comment" className="sr-only">
          시민 코멘트 입력
        </label>
        <textarea
          id="comment"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"이 법안에 대한 의견을 3줄 이내로 남겨 주세요.\n예) 처벌범위가 너무 추상적이라고 생각합니다."}
          className="surface w-full resize-y rounded-xl p-3 text-[0.9375rem] leading-relaxed outline-none"
          style={{ borderColor: "var(--border-strong)" }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="text-[0.75rem] font-semibold tabular-nums"
            style={{ color: tooLong ? "var(--color-lv-void)" : "var(--text-3)" }}
          >
            {text.length} / {MAX_CHARS}자
          </span>
          <span
            className="text-[0.75rem] font-semibold tabular-nums"
            style={{ color: tooManyLines ? "var(--color-lv-void)" : "var(--text-3)" }}
          >
            {lines} / {MAX_LINES}줄
          </span>
          {duplicate ? (
            <span className="text-[0.75rem] font-bold" style={{ color: "var(--color-lv-void)" }}>
              같은 내용이 이미 등록되어 있습니다.
            </span>
          ) : null}
          <button
            type="submit"
            disabled={invalid}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40"
            style={{ background: "var(--color-opinion)", color: "#fff" }}
          >
            등록
          </button>
        </div>
      </form>

      <ul className="mt-4 divide-y" style={{ borderColor: "var(--border)" }}>
        {items.length === 0 ? (
          <li className="py-4 text-sm text-dim">아직 등록된 코멘트가 없습니다.</li>
        ) : (
          items.map((c) => (
            <li key={c.id} className="py-3 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.8125rem] font-bold">{c.handle}</span>
                {c.vote ? (
                  <span
                    className="rounded px-1.5 py-0.5 text-[0.6875rem] font-bold"
                    style={{
                      color: c.vote === "UNFIT" ? "#c0182b" : "#1f8a5b",
                      background: `color-mix(in srgb, ${c.vote === "UNFIT" ? "#c0182b" : "#1f8a5b"} 10%, transparent)`,
                    }}
                  >
                    {c.vote === "UNFIT" ? "🔴 부적합 의견" : "🟢 적합 의견"}
                  </span>
                ) : null}
                <time className="ml-auto text-[0.75rem] tabular-nums text-faint" dateTime={c.createdAt}>
                  {dt(c.createdAt)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-line text-[0.9375rem] leading-relaxed">{c.body}</p>
            </li>
          ))
        )}
      </ul>

      <p className="mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: "var(--surface-2)" }}>
        <strong className="font-bold">데모 안내</strong> — 입력한 코멘트는 저장되지 않고 화면에만 표시됩니다.
        실제 서비스에서는 투표를 마친 인증 사용자만 작성할 수 있고, 도배·스팸·개인정보 노출은 운영원칙에 따라
        숨김 처리되며 모든 관리행위가 로그로 남습니다.
      </p>
    </div>
  );
}
