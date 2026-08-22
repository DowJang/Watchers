"use client";

import { useState } from "react";
import type { Bill } from "@/lib/types";
import { courtLabel, statusLabel } from "@/lib/labels";
import { summaryOf } from "@/lib/repo";
import { getLegislator, getParty } from "@/lib/repo";
import { d } from "@/lib/format";

/**
 * 외부 AI에게 물어보기.
 *
 * 감시자들은 법안의 위헌 여부에 대해 자체 판단을 만들지 않는다. 대신 사용자가 원하면
 * 페이지의 공식 기록(FACT)만으로 프롬프트를 만들어, 사용자가 직접 고른 외부 AI 서비스에
 * 물어볼 수 있게 한다. 결과는 그 AI 서비스의 답변이지 감시자들의 판단이 아니다.
 *
 * claude.ai 의 ?q= 프리필 파라미터는 2025년 하반기 보안상의 이유로 제거되었고,
 * ChatGPT/Gemini 도 비공식 URL 파라미터에 의존하면 언제든 깨질 수 있다. 그래서
 * 클립보드에 프롬프트를 복사한 뒤 각 서비스의 기본 새 대화 주소만 여는, 벤더 변경에
 * 흔들리지 않는 방식을 쓴다.
 */

const targets = [
  { key: "chatgpt", label: "챗GPT에게 물어보기", url: "https://chatgpt.com/" },
  { key: "claude", label: "클로드에게 물어보기", url: "https://claude.ai/new" },
  { key: "gemini", label: "제미나이에게 물어보기", url: "https://gemini.google.com/app" },
] as const;

export function buildBillPrompt(bill: Bill): string {
  const { fact } = bill;
  const summary = summaryOf(bill);
  const sponsor = fact.proposal.sponsorId ? getLegislator(fact.proposal.sponsorId) : undefined;
  const party = sponsor ? getParty(sponsor.partyId).name : undefined;

  const lines: string[] = [
    `다음은 대한민국 국회에 발의된 법안의 공식 기록입니다. 이 법안이 대한민국헌법과 어떤 지점에서 충돌하거나 부합하는지, 위헌 여부에 대한 네 판단과 그 근거를 알려줘.`,
    ``,
    `[법안명] ${fact.title}`,
    `[의안번호] ${fact.billNo}`,
    `[소관위원회] ${fact.committee}`,
    `[현재 처리상태] ${statusLabel[fact.status]}`,
    `[발의일] ${d(fact.proposal.proposedAt) || "확인 필요"}`,
  ];

  if (sponsor) lines.push(`[대표발의자] ${sponsor.name} / ${party ?? "확인 필요"}`);
  if (fact.proposal.coSponsorIds.length > 0) {
    lines.push(`[공동발의자 수] ${fact.proposal.coSponsorIds.length}명`);
  }
  if (fact.proposal.officialReasonExcerpt) {
    lines.push(`[공식 제안이유] ${fact.proposal.officialReasonExcerpt}`);
  }
  if (summary.whatItIs) lines.push(`[쉬운 요약] ${summary.whatItIs}`);
  if (fact.vote) {
    lines.push(
      `[본회의 표결] 찬성 ${fact.vote.for.length} / 반대 ${fact.vote.against.length} / 기권 ${fact.vote.abstain.length} / 불참 ${fact.vote.absent.length} (${fact.vote.result})`,
    );
  }
  lines.push(`[헌법재판소 판단] ${courtLabel[fact.courtStatus]}`);
  if (fact.courtCaseNo) lines.push(`[헌재 사건번호] ${fact.courtCaseNo}`);

  const sourceUrl = fact.sources[0]?.url;
  if (sourceUrl) lines.push(``, `공식 원문: ${sourceUrl}`);

  lines.push(
    ``,
    `관련 헌법 조항, 명확성원칙·과잉금지원칙 등 적용 가능한 헌법상 원칙, 위헌 측과 합헌 측 논거를 균형 있게 제시해줘.`,
  );

  return lines.join("\n");
}

export function AskExternalAI({ bill }: { bill: Bill }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(target: (typeof targets)[number]) {
    setError(null);
    const prompt = buildBillPrompt(bill);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedKey(target.key);
      window.setTimeout(() => setCopiedKey((k) => (k === target.key ? null : k)), 4000);
    } catch {
      setError("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해 주세요.");
    }
    window.open(target.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="surface rounded-2xl p-4" style={{ borderColor: "var(--border)" }}>
      <p className="text-[0.8125rem] font-extrabold text-faint">외부 AI에게 물어보기</p>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-dim">
        아래 버튼을 누르면 이 법안의 공식 기록으로 만든 질문이 클립보드에 복사되고, 선택한 AI
        서비스가 새 탭에서 열립니다. 새 탭에 붙여넣기(Ctrl+V 또는 ⌘V)만 하면 됩니다. 답변은 해당
        AI 서비스의 결과이며, <strong className="font-bold">감시자들의 판단이 아닙니다.</strong>
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {targets.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => void ask(t)}
            className="rounded-xl border px-3 py-2.5 text-[0.875rem] font-bold transition-colors"
            style={{ borderColor: "var(--border-strong)", background: "var(--surface-2)" }}
          >
            {copiedKey === t.key ? "복사됨 — 붙여넣기 하세요" : t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-2 text-[0.8125rem] font-bold" style={{ color: "var(--color-lv-void)" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
