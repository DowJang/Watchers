"use client";

import Link from "next/link";
import { Panel, LiveOnly } from "@/components/admin/ui";
import { reviewStages } from "@/lib/admin";
import { voteBoard } from "@/lib/admin";

/** 제작서 §12, §21 — 헌재 제출 검토 대시보드 */
export default function AdminReviewPage() {
  const fired = voteBoard().filter((r) => r.triggered);

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl border-2 px-4 py-3"
        style={{ borderColor: "var(--color-lv-void)", background: "color-mix(in srgb, var(--color-lv-void) 7%, transparent)" }}
      >
        <p className="text-[0.875rem] font-extrabold" style={{ color: "var(--color-lv-void)" }}>
          자동 제출 금지
        </p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-dim">
          1,000표 격차가 발생했다는 이유만으로 헌법재판소에 정식 심판을 청구할 수 없습니다.
          위헌법률심판은 법률의 위헌 여부가 실제 재판의 전제가 되어 법원이 제청해야 하고, 헌법소원은
          기본권을 침해받은 적법한 청구인·청구기간·구제절차 요건을 충족해야 합니다. 이 화면은 요건을
          검토하는 절차를 관리하기 위한 것이며, 사이트가 청구인을 가장하거나 인증절차를 우회하지 않습니다.
        </p>
      </div>

      <Panel title="검토 단계" desc="제작서 §21">
        <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {reviewStages.map((s, i) => (
            <li
              key={s}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.8125rem]"
              style={{ background: "var(--surface-2)" }}
            >
              <span className="w-5 shrink-0 text-right font-mono font-bold text-faint">{i + 1}</span>
              <span className="font-semibold">{s}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="검토 대상" desc="Trigger 가 발생한 법안">
        {fired.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">현재 검토 대상이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {fired.map((r) => (
              <li key={r.bill.id} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                <Link href={`/bills/${r.bill.id}`} className="text-[0.9375rem] font-bold">
                  {r.bill.fact.title}
                </Link>
                <p className="mt-1 text-[0.8125rem] text-dim">
                  현재 상태: <strong className="font-bold">Trigger 발생</strong> — 검토자료 생성 대기
                </p>
                <ul className="mt-2 space-y-0.5 text-[0.75rem] leading-relaxed text-faint">
                  <li>· 법안이 아직 국회 계류 중이면 정식 위헌심판 대상으로 제출하지 않습니다.</li>
                  <li>· 공포·시행 후 기본권 침해가 발생한 경우에만 헌법소원 요건을 검토합니다.</li>
                  <li>· 법원에서 관련 사건이 진행 중이면 당사자의 제청신청 가능성을 검토합니다.</li>
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="검토패키지 생성" desc="대상 법률 · 관련 헌법조항 · 공식 판례 · 시민 투표 결과 · 청구경로 · 청구기간 확인항목">
        <LiveOnly what="검토패키지 생성 이력 및 상태" />
      </Panel>
    </div>
  );
}
