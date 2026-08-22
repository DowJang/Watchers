"use client";

import { useEffect, useState } from "react";
import { Panel, LiveOnly, TableWrap } from "@/components/admin/ui";
import { backendConfigured, supabase } from "@/lib/supabase";
import { dt } from "@/lib/format";

interface AuditRow {
  id: string;
  created_at: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  before_value: string | null;
  after_value: string | null;
  reason: string | null;
}

/** 제작서 §23 — 방문·투표·댓글 Audit Log */
export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(backendConfigured);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    void (async () => {
      const { data } = await sb
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      setRows((data ?? []) as AuditRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border px-4 py-3" style={{ borderColor: "var(--border-strong)" }}>
        <p className="text-[0.875rem] font-bold">중요한 변경은 삭제하지 않고 이력으로 남깁니다.</p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-dim">
          투표 변경, 댓글 숨김·복원, 수신처 변경, 긴급 중지, FACT 정정이 모두 여기에 기록됩니다.
          이 표는 append-only 이며 관리자도 행을 지울 수 없습니다.
        </p>
      </div>

      <Panel title="변경 이력">
        {!backendConfigured ? (
          <LiveOnly what="투표 변경 · 댓글 조치 · 관리자 행위 로그" />
        ) : loading ? (
          <p className="py-6 text-center text-sm text-dim">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">아직 기록이 없습니다.</p>
        ) : (
          <TableWrap>
            <thead>
              <tr className="border-b text-left text-[0.6875rem] text-faint">
                <th className="py-2 pr-3 font-bold">시각</th>
                <th className="py-2 pr-3 font-bold">행위자</th>
                <th className="py-2 pr-3 font-bold">동작</th>
                <th className="py-2 pr-3 font-bold">대상</th>
                <th className="py-2 pr-3 font-bold">변경</th>
                <th className="py-2 pr-3 font-bold">사유</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3 tabular-nums">{dt(r.created_at)}</td>
                  <td className="py-2 pr-3 font-mono text-[0.75rem]">{r.actor}</td>
                  <td className="py-2 pr-3 font-semibold">{r.action}</td>
                  <td className="py-2 pr-3 font-mono text-[0.75rem]">
                    {r.target_type} {r.target_id}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[0.75rem]">
                    {r.before_value ?? "-"} → {r.after_value ?? "-"}
                  </td>
                  <td className="py-2 pr-3 text-faint">{r.reason ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
