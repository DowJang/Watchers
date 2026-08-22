"use client";

import { Panel, Stat, StatGrid, TableWrap } from "@/components/admin/ui";
import { healthMeta, systemHealth } from "@/lib/admin";
import { bills, legislators, siteMeta, syncRuns } from "@/lib/repo";
import { dt } from "@/lib/format";

const statusTone: Record<string, { label: string; color: string }> = {
  ok: { label: "정상", color: "#1f8a5b" },
  empty: { label: "수집 0건", color: "#b98400" },
  skipped: { label: "건너뜀", color: "#b98400" },
  failed: { label: "실패", color: "#c0182b" },
};

/** 제작서 §18.1 — Official Data Monitor */
export default function AdminSystemPage() {
  const health = systemHealth();

  return (
    <div className="space-y-5">
      <StatGrid>
        <Stat label="데이터 출처" value={siteMeta.dataOrigin === "OFFICIAL" ? "공식 기록" : "예시 데이터"} tone={siteMeta.dataOrigin === "OFFICIAL" ? "good" : "warn"} />
        <Stat label="법안" value={bills.length} />
        <Stat label="의원" value={legislators.length} />
        <Stat label="동기화 이력" value={syncRuns.length} hint="최근 30회 보관" />
      </StatGrid>

      <Panel title="상태 요약">
        <ul className="space-y-2">
          {health.map((h) => (
            <li key={h.label} className="flex flex-wrap items-baseline gap-x-3">
              <span className="shrink-0 font-bold" style={{ color: healthMeta[h.level].color }}>
                {healthMeta[h.level].dot}
              </span>
              <span className="text-[0.875rem] font-semibold">{h.label}</span>
              <span className="text-[0.875rem] text-dim">{h.value}</span>
              {h.hint ? <span className="w-full text-[0.75rem] text-faint">{h.hint}</span> : null}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="동기화 실행 기록"
        desc="매일 00:00 KST · GitHub Actions '공식 데이터 동기화'"
      >
        {syncRuns.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4" style={{ borderColor: "var(--border-strong)" }}>
            <p className="text-sm font-bold">아직 실행 기록이 없습니다.</p>
            <ol className="mt-2 space-y-1 text-[0.8125rem] leading-relaxed text-dim">
              <li>1. 열린국회정보(open.assembly.go.kr)에서 인증키를 발급받습니다.</li>
              <li>
                2. 저장소 Settings → Secrets and variables → Actions 에 <code className="font-mono">ASSEMBLY_API_KEY</code> 로 등록합니다.
                공포·시행일까지 받으려면 <code className="font-mono">LAW_GO_KR_OC</code> 도 함께 등록합니다.
              </li>
              <li>3. Actions 탭에서 “공식 데이터 동기화” 를 수동 실행합니다.</li>
              <li>4. 수집 결과가 커밋되면 배포 워크플로가 이어서 돌고, 사이트가 공식 기록으로 바뀝니다.</li>
            </ol>
          </div>
        ) : (
          <TableWrap>
            <thead>
              <tr className="border-b text-left text-[0.6875rem] text-faint">
                <th className="py-2 pr-3 font-bold">시각</th>
                <th className="py-2 pr-3 font-bold">상태</th>
                <th className="py-2 pr-3 font-bold">로그</th>
              </tr>
            </thead>
            <tbody>
              {syncRuns.map((run) => (
                <tr key={run.startedAt} className="border-b align-top last:border-b-0">
                  <td className="py-2 pr-3 tabular-nums">{dt(run.startedAt)}</td>
                  <td className="py-2 pr-3 font-bold" style={{ color: statusTone[run.status]?.color }}>
                    {statusTone[run.status]?.label ?? run.status}
                  </td>
                  <td className="py-2 pr-3">
                    <ul className="space-y-0.5">
                      {run.entries.map((e, i) => (
                        <li
                          key={i}
                          className="text-[0.75rem] leading-relaxed"
                          style={{
                            color:
                              e.level === "error"
                                ? "var(--color-lv-void)"
                                : e.level === "warn"
                                  ? "#b98400"
                                  : "var(--text-2)",
                          }}
                        >
                          {e.message}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title="정정 절차" desc="제작서 §29 — FACT 오류는 임의수정으로 끝내지 않습니다">
        <p className="text-[0.875rem] leading-relaxed text-dim">
          오류 확인 → 공식 원문 확인 → FACT 수정 → 수정일시 기록 → 이전값 보존 → 정정내역 공개.
          공식 기록은 동기화가 덮어쓰므로, 수집 단계의 매핑을 고쳐야 하는 문제인지 원본 자체의 문제인지를
          먼저 구분합니다.
        </p>
      </Panel>
    </div>
  );
}
