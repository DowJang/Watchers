"use client";

import { useEffect, useState } from "react";
import { Panel, Stat, StatGrid, TableWrap, LiveOnly } from "@/components/admin/ui";
import { backendConfigured, supabase } from "@/lib/supabase";
import { dt } from "@/lib/format";

interface Recipient {
  id: string;
  outlet: string;
  desk: string;
  email: string;
  active: boolean;
  verified_at: string | null;
}

/** 제작서 §13, §20 — 언론 발송 대시보드 */
export default function AdminMediaPage() {
  const [rows, setRows] = useState<Recipient[]>([]);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(backendConfigured);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    void (async () => {
      const [{ data: recipients }, { data: setting }] = await Promise.all([
        sb.from("media_recipients").select("*").order("outlet"),
        sb.from("system_settings").select("value").eq("key", "media_emergency_pause").maybeSingle(),
      ]);
      setRows((recipients ?? []) as Recipient[]);
      setPaused(setting?.value === "true");
      setLoading(false);
    })();
  }, []);

  async function togglePause() {
    const sb = supabase();
    if (!sb) return;
    const next = !paused;
    setPaused(next);
    await sb.from("system_settings").upsert({ key: "media_emergency_pause", value: String(next) });
  }

  const active = rows.filter((r) => r.active).length;

  return (
    <div className="space-y-5">
      <StatGrid>
        <Stat label="등록 수신처" value={backendConfigured ? rows.length : "—"} hint="최대 10곳" />
        <Stat label="활성" value={backendConfigured ? active : "—"} />
        <Stat label="발송 성공" value="—" hint="백엔드 연결 후" />
        <Stat label="반송 / 실패" value="—" hint="백엔드 연결 후" />
      </StatGrid>

      {/* EMERGENCY PAUSE (§20) */}
      <Panel title="긴급 중지" desc="자동발송 전체를 한 번에 멈춥니다">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={togglePause}
            disabled={!backendConfigured}
            className="rounded-xl px-5 py-3 text-sm font-extrabold disabled:opacity-40"
            style={{
              background: paused ? "#1f8a5b" : "var(--color-lv-void)",
              color: "#fff",
            }}
          >
            {paused ? "발송 재개" : "EMERGENCY PAUSE"}
          </button>
          <p className="text-[0.8125rem] text-dim">
            {!backendConfigured
              ? "백엔드 연결 후 동작합니다."
              : paused
                ? "현재 모든 자동발송이 중지되어 있습니다."
                : "자동발송이 활성 상태입니다."}
          </p>
        </div>
      </Panel>

      <Panel
        title="수신처"
        desc="공개된 공식 취재·제보·정치부 연락처만 등록합니다. 하드코딩하지 않습니다."
      >
        {!backendConfigured ? (
          <LiveOnly what="언론사 수신처 목록 (추가 · 삭제 · 변경 · 일시정지)" />
        ) : loading ? (
          <p className="py-6 text-center text-sm text-dim">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">등록된 수신처가 없습니다.</p>
        ) : (
          <TableWrap>
            <thead>
              <tr className="border-b text-left text-[0.6875rem] text-faint">
                <th className="py-2 pr-3 font-bold">언론사</th>
                <th className="py-2 pr-3 font-bold">부서</th>
                <th className="py-2 pr-3 font-bold">이메일</th>
                <th className="py-2 pr-3 font-bold">상태</th>
                <th className="py-2 pr-3 font-bold">최종 검증</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3 font-semibold">{r.outlet}</td>
                  <td className="py-2 pr-3">{r.desk}</td>
                  <td className="py-2 pr-3 font-mono text-[0.75rem]">{r.email}</td>
                  <td className="py-2 pr-3 font-bold" style={{ color: r.active ? "#1f8a5b" : "var(--text-3)" }}>
                    {r.active ? "활성" : "일시정지"}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-faint">
                    {r.verified_at ? dt(r.verified_at) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel title="발송 기록" desc="한 법안의 동일 Trigger 에 대해 각 언론사에 1회만 발송합니다">
        <LiveOnly what="수신처 · 발송시각 · 내용 버전 · 성공/실패 · 반송 · 재전송" />
      </Panel>

      <Panel title="제목·문구 규칙" desc="제작서 §13.2">
        <p className="text-[0.875rem] leading-relaxed">
          예: <code className="font-mono text-[0.8125rem]">[감시자들 시민의견 알림] ○○법안 헌법 부적합 의견 1,000표 격차 도달</code>
        </p>
        <p className="mt-2 text-[0.8125rem] font-bold" style={{ color: "var(--color-lv-void)" }}>
          사용 금지: “위헌법 확정”, “반헌법 의원”, “헌법파괴법”, “국민이 위헌 판정”
        </p>
        <p className="mt-1 text-[0.8125rem] text-dim">
          모든 발송 본문에는 “헌재 위헌확정이 아님” 고지를 포함합니다.
        </p>
      </Panel>
    </div>
  );
}
