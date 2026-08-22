"use client";

import { useEffect, useState } from "react";
import { Panel, Stat, StatGrid, LiveOnly } from "@/components/admin/ui";
import { backendConfigured, supabase } from "@/lib/supabase";
import { dt } from "@/lib/format";

interface CommentRow {
  id: string;
  bill_id: string;
  body: string;
  vote: "UNFIT" | "FIT" | null;
  status: "VISIBLE" | "HIDDEN";
  reported_count: number;
  created_at: string;
}

/** 제작서 §16, §22 — 댓글 대시보드 */
export default function AdminCommentsPage() {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(backendConfigured);
  const [filter, setFilter] = useState<"ALL" | "REPORTED" | "HIDDEN">("ALL");

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    void (async () => {
      const { data } = await sb
        .from("comments")
        .select("id,bill_id,body,vote,status,reported_count,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data ?? []) as CommentRow[]);
      setLoading(false);
    })();
  }, []);

  async function moderate(id: string, status: "VISIBLE" | "HIDDEN", reason: string) {
    const sb = supabase();
    if (!sb) return;
    // 숨김/복원은 SECURITY DEFINER 함수를 거쳐 Audit Log 에 반드시 남는다 (§16, §23).
    await sb.rpc("moderate_comment", { p_comment_id: id, p_status: status, p_reason: reason });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  const visible = rows.filter((r) => {
    if (filter === "REPORTED") return r.reported_count > 0;
    if (filter === "HIDDEN") return r.status === "HIDDEN";
    return true;
  });

  return (
    <div className="space-y-5">
      <StatGrid>
        <Stat label="전체 댓글" value={backendConfigured ? rows.length : "—"} />
        <Stat
          label="신고됨"
          value={backendConfigured ? rows.filter((r) => r.reported_count > 0).length : "—"}
          tone="warn"
        />
        <Stat label="숨김" value={backendConfigured ? rows.filter((r) => r.status === "HIDDEN").length : "—"} />
        <Stat label="오늘 작성" value="—" hint="백엔드 연결 후" />
      </StatGrid>

      <div
        className="rounded-xl border px-4 py-3"
        style={{ borderColor: "var(--border-strong)" }}
      >
        <p className="text-[0.875rem] font-bold">
          정치적 의견이 마음에 들지 않는다는 이유로 삭제해서는 안 됩니다.
        </p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-dim">
          숨김·삭제 대상은 반복 도배, 자동생성 스팸, 개인정보 노출, 직접적 협박, 불법정보, 타인 사칭,
          법안과 무관한 광고, 동일 문구 대량복제입니다. 관리자의 모든 조치는 Audit Log 에 기록됩니다.
        </p>
      </div>

      <Panel
        title="댓글 목록"
        action={
          <div className="flex gap-1">
            {(["ALL", "REPORTED", "HIDDEN"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="rounded-lg px-2.5 py-1 text-[0.75rem] font-bold"
                style={{
                  background: filter === f ? "var(--color-fact)" : "var(--surface-2)",
                  color: filter === f ? "#fff" : "var(--text-2)",
                }}
              >
                {{ ALL: "전체", REPORTED: "신고", HIDDEN: "숨김" }[f]}
              </button>
            ))}
          </div>
        }
      >
        {!backendConfigured ? (
          <LiveOnly what="시민 코멘트 목록 · 신고 · 스팸 감지 · 숨김 처리" />
        ) : loading ? (
          <p className="py-6 text-center text-sm text-dim">불러오는 중…</p>
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-sm text-dim">해당 댓글이 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {visible.map((r) => (
              <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 text-[0.75rem]">
                  <span className="font-mono text-faint">{r.bill_id}</span>
                  {r.vote ? (
                    <span
                      className="rounded px-1.5 py-0.5 font-bold"
                      style={{ color: r.vote === "UNFIT" ? "#c0182b" : "#1f8a5b" }}
                    >
                      {r.vote === "UNFIT" ? "부적합" : "적합"}
                    </span>
                  ) : null}
                  {r.reported_count > 0 ? (
                    <span className="font-bold" style={{ color: "#b98400" }}>
                      신고 {r.reported_count}
                    </span>
                  ) : null}
                  {r.status === "HIDDEN" ? (
                    <span className="font-bold text-faint">숨김</span>
                  ) : null}
                  <time className="ml-auto tabular-nums text-faint">{dt(r.created_at)}</time>
                </div>
                <p className="mt-1 whitespace-pre-line text-[0.875rem] leading-relaxed">{r.body}</p>
                <div className="mt-1.5 flex gap-2">
                  {r.status === "VISIBLE" ? (
                    <button
                      type="button"
                      onClick={() => void moderate(r.id, "HIDDEN", "spam")}
                      className="text-[0.75rem] font-bold underline"
                      style={{ color: "var(--color-lv-void)" }}
                    >
                      숨기기
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void moderate(r.id, "VISIBLE", "restore")}
                      className="text-[0.75rem] font-bold underline"
                      style={{ color: "#1f8a5b" }}
                    >
                      복원
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
