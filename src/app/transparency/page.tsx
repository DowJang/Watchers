import type { Metadata } from "next";
import { FactZone, AnalysisZone, OpinionZone } from "@/components/Zone";
import { conflictMeta, conflictOrder, TRIGGER_THRESHOLD } from "@/lib/labels";
import { ConflictBadge } from "@/components/Badges";
import { SITE, siteMeta } from "@/lib/site";
import { dt, n } from "@/lib/format";

export const metadata: Metadata = {
  title: "투명성",
  description: "데이터 출처, 분석 기준, 투표 집계 방식, 정정 내역을 공개합니다.",
};

const allowedSources: Array<[string, string[]]> = [
  [
    "입법부",
    [
      "대한민국 국회",
      "국회의안정보시스템",
      "열린국회정보",
      "국회회의록",
      "본회의 표결정보",
      "상임위원회 회의록·검토보고서·심사보고서",
    ],
  ],
  ["사법부", ["대한민국 법원", "대법원", "공식 판결문·판례정보"]],
  ["헌법기관", ["헌법재판소", "헌법재판소 결정례", "전자헌법재판센터 공식 사건정보"]],
  [
    "행정부",
    ["국가법령정보센터", "법제처", "전자관보", "정부 제출 법률안 공식자료", "대통령 공포·재의요구 공식기록"],
  ],
];

const excluded = [
  "언론기사",
  "방송보도",
  "정당 논평",
  "의원 개인 SNS",
  "유튜브",
  "블로그",
  "온라인 커뮤니티",
  "시민단체 주장",
  "정치평론",
  "익명 관계자 발언",
  "인터넷 여론",
];

export default function TransparencyPage() {
  return (
    <>
      <header className="pb-1 pt-2">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">투명성</h1>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-dim">
          {SITE.name}이 무엇을 근거로 삼고, 무엇을 근거로 삼지 않는지 공개합니다.
        </p>
      </header>

      <div className="mt-5 space-y-5">
        {/* 데이터 출처 */}
        <FactZone
          title="FACT 데이터 출처"
          note={`공식자료 최종 확인 ${dt(siteMeta.lastSyncedAt)} · 기본 자동 업데이트 매일 00:00 KST`}
        >
          <p className="text-[0.9375rem] leading-relaxed">
            사이트의 FACT 데이터는 대한민국 입법부·사법부·행정부 및 헌법기관의 공식 기록만을 사용합니다.
            공식 기록에 없는 사실은 사실로 표시하지 않습니다.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allowedSources.map(([group, items]) => (
              <li key={group} className="rounded-xl p-3" style={{ background: "var(--surface-2)" }}>
                <p className="text-[0.8125rem] font-extrabold" style={{ color: "var(--fact-fg)" }}>
                  {group}
                </p>
                <ul className="mt-1.5 space-y-0.5 text-[0.875rem] text-dim">
                  {items.map((i) => (
                    <li key={i}>· {i}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div
            className="mt-4 rounded-xl border-2 border-dashed p-3"
            style={{ borderColor: "var(--border-strong)" }}
          >
            <p className="text-[0.8125rem] font-extrabold" style={{ color: "var(--color-lv-void)" }}>
              FACT 근거로 사용하지 않는 출처
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {excluded.map((e) => (
                <span
                  key={e}
                  className="rounded-md px-2 py-0.5 text-[0.8125rem] font-semibold line-through"
                  style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
                >
                  {e}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[0.8125rem] text-dim">
              이 자료들은 사이트가 다루는 사실정보의 근거로 사용하지 않습니다.
            </p>
          </div>
        </FactZone>

        {/* 업데이트 주기 */}
        <FactZone title="업데이트 주기">
          <dl className="space-y-2 text-[0.9375rem]">
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-32 shrink-0 font-semibold text-faint">국가기관 FACT</dt>
              <dd className="min-w-0 flex-1">매일 00:00 KST 정기 동기화</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="w-32 shrink-0 font-semibold text-faint">시민 참여</dt>
              <dd className="min-w-0 flex-1">투표·코멘트·Trigger·알림은 실시간 처리</dd>
            </div>
          </dl>
        </FactZone>

        {/* 분석 기준 */}
        <AnalysisZone title="쉬운 요약과 헌법충돌 분석 기준">
          <ol className="space-y-2 text-[0.9375rem] leading-relaxed">
            <li>
              <strong className="font-bold">1. 무슨 법인가</strong> — 법률용어를 제거한 1~2줄 요약을 만듭니다.
              평가를 섞지 않습니다.
            </li>
            <li>
              <strong className="font-bold">2. 왜 만들었나</strong> — 「제안이유 및 주요내용」, 위원회
              검토보고서, 공식 회의록, 정부 제출안의 공식 제안이유 등 공식 문서에 적힌 이유만 사용합니다.
              발의 동기를 추측하지 않습니다.
            </li>
            <li>
              <strong className="font-bold">3. VS 헌법</strong> — 관련 헌법조항 원문과 헌법상 원칙을 대조하고,
              위헌 측 논거와 합헌 측 논거를 같은 비중으로 제시합니다.
            </li>
            <li>
              <strong className="font-bold">4. 충돌등급</strong> — 아래 5단계로 표시합니다. 헌법재판소가
              판단하기 전에는 “위헌 확정”이라고 표현하지 않습니다.
            </li>
          </ol>

          <ul className="mt-3 space-y-2">
            {conflictOrder.map((lv) => (
              <li key={lv} className="flex flex-wrap items-center gap-2">
                <ConflictBadge level={lv} full size="sm" />
                <span className="text-[0.875rem] text-dim">{conflictMeta[lv].desc}</span>
              </li>
            ))}
          </ul>
        </AnalysisZone>

        {/* 투표 집계 */}
        <OpinionZone title="투표 집계와 중복투표 방지 원칙">
          <ul className="space-y-1.5 text-[0.9375rem] leading-relaxed">
            <li>· 1인 1법안 1표를 원칙으로 합니다.</li>
            <li>· 본인확인을 거친 사용자에게 1표를 부여하는 인증 투표 방식을 사용합니다.</li>
            <li>
              · 주민등록번호를 직접 수집하지 않습니다. 본인확인 결과의 중복확인용 식별값만 안전하게 변환·보관해
              동일인 여부만 확인합니다.
            </li>
            <li>· 투표는 변경할 수 있으나 현재 활성표는 하나만 인정하며, 모든 변경은 감사로그에 남습니다.</li>
            <li>· 단순 IP만으로 동일인을 판정하지 않습니다.</li>
            <li>· 투표 결과 공개 시 이름·전화번호·이메일 등 개인 식별정보를 노출하지 않습니다.</li>
          </ul>

          <div className="mt-3 rounded-xl p-3" style={{ background: "var(--surface)" }}>
            <p className="text-[0.8125rem] font-extrabold" style={{ color: "var(--opinion-fg)" }}>
              {n(TRIGGER_THRESHOLD)}표 격차 Trigger 조건
            </p>
            <p className="mt-1 font-mono text-[0.875rem]">부적합 투표수 − 적합 투표수 ≥ {n(TRIGGER_THRESHOLD)}</p>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-dim">
              조건을 처음 충족한 순간의 집계를 스냅샷으로 영구 보존하고, 이후 수치가 다시 내려가더라도 기록을
              삭제하지 않습니다. Trigger는 자동 위헌심판 청구가 아니라 <strong className="font-bold">헌재 제출
              요건 검토절차의 자동 개시</strong>를 의미합니다.
            </p>
          </div>
        </OpinionZone>

        {/* 댓글 운영원칙 */}
        <OpinionZone title="시민 코멘트 운영원칙">
          <p className="text-[0.9375rem] leading-relaxed">
            반복 도배, 자동생성 스팸, 개인정보 노출, 직접적 협박, 불법정보, 타인 사칭, 법안과 무관한 광고,
            동일 문구 대량복제는 숨김 또는 삭제 대상입니다.
          </p>
          <p className="mt-2 text-[0.9375rem] font-bold leading-relaxed">
            정치적 의견이 마음에 들지 않는다는 이유로 삭제하지 않습니다.
          </p>
          <p className="mt-2 text-[0.875rem] text-dim">관리자의 조치도 모두 감사로그에 기록합니다.</p>
        </OpinionZone>

        {/* 정정 내역 */}
        <FactZone title="정정 내역" note="FACT 오류는 관리자 임의수정으로 끝내지 않고 이전값을 보존한 뒤 공개합니다.">
          <p className="text-[0.9375rem] leading-relaxed">
            정정 절차: 오류 확인 → 공식 원문 확인 → FACT 수정 → 수정일시 기록 → 이전값 보존 → 정정내역 공개
          </p>
          <p className="mt-3 rounded-lg px-3 py-2 text-[0.875rem] text-dim" style={{ background: "var(--surface-2)" }}>
            현재 공개된 정정 내역이 없습니다.
          </p>
          <p className="mt-3 text-[0.875rem] text-dim">
            데이터 오류를 발견하시면 해당 법안의 공식 원문 링크와 함께 알려 주십시오. 확인 후 위 절차에 따라
            처리하고 내역을 공개합니다.
          </p>
        </FactZone>

        {/* 하지 않는 것 */}
        <FactZone title="감시자들이 하지 않는 것">
          <ul className="grid grid-cols-1 gap-1.5 text-[0.9375rem] sm:grid-cols-2">
            {[
              "특정 정당 지지",
              "특정 정당 반대",
              "정치인 호감도 평가",
              "언론기사 재가공",
              "익명 정치정보 유통",
              "투표결과를 공식 국민투표로 표현",
              "1,000표를 위헌판정으로 표현",
              "방문자 의견으로 헌법적 결론 확정",
              "법적 자격 없는 사람 명의로 헌재 청구",
              "AI가 공식 FACT를 추측하여 생성",
            ].map((x) => (
              <li key={x} className="flex gap-2">
                <span aria-hidden style={{ color: "var(--color-lv-void)" }}>
                  ✕
                </span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </FactZone>
      </div>
    </>
  );
}
