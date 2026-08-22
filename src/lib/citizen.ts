"use client";

import { supabase, backendConfigured } from "./supabase";

/**
 * 시민 참여(투표·코멘트) 클라이언트.
 *
 * 집계와 중복 방지는 전부 Postgres 쪽 SECURITY DEFINER 함수에서 이루어진다.
 * 브라우저는 결과만 받는다 — 여기서 표를 세거나 중복을 판정하지 않는다.
 */

export type Choice = "UNFIT" | "FIT";

export interface Tally {
  unfit: number;
  fit: number;
  difference: number;
  verifiedVoters: number;
  updatedAt: string | null;
}

export interface TriggerRecord {
  triggeredAt: string;
  unfitVotes: number;
  fitVotes: number;
  difference: number;
  verifiedVoterCount: number;
  correctionNote: string | null;
}

export interface PublicComment {
  id: string;
  billId: string;
  body: string;
  vote: Choice | null;
  handle: string;
  createdAt: string;
}

/** 한 법안의 공개 집계 + Trigger 기록 + 내 표를 한 번에 읽는다. */
export async function loadBillOpinion(billId: string): Promise<{
  tally: Tally | null;
  trigger: TriggerRecord | null;
  myChoice: Choice | null;
  signedIn: boolean;
} | null> {
  const sb = supabase();
  if (!sb) return null;

  const [{ data: tallyRow }, { data: triggerRow }, { data: sessionData }] = await Promise.all([
    sb.from("bill_vote_tally").select("*").eq("bill_id", billId).maybeSingle(),
    sb.from("alert_triggers").select("*").eq("bill_id", billId).maybeSingle(),
    sb.auth.getSession(),
  ]);

  let myChoice: Choice | null = null;
  const signedIn = Boolean(sessionData.session);
  if (signedIn) {
    const { data: mine } = await sb
      .from("citizen_votes")
      .select("choice")
      .eq("bill_id", billId)
      .maybeSingle();
    myChoice = (mine?.choice as Choice) ?? null;
  }

  return {
    tally: tallyRow
      ? {
          unfit: Number(tallyRow.unfit ?? 0),
          fit: Number(tallyRow.fit ?? 0),
          difference: Number(tallyRow.difference ?? 0),
          verifiedVoters: Number(tallyRow.verified_voters ?? 0),
          updatedAt: tallyRow.updated_at ?? null,
        }
      : { unfit: 0, fit: 0, difference: 0, verifiedVoters: 0, updatedAt: null },
    trigger: triggerRow
      ? {
          triggeredAt: triggerRow.triggered_at,
          unfitVotes: Number(triggerRow.unfit_votes),
          fitVotes: Number(triggerRow.fit_votes),
          difference: Number(triggerRow.difference),
          verifiedVoterCount: Number(triggerRow.verified_voter_count),
          correctionNote: triggerRow.correction_note ?? null,
        }
      : null,
    myChoice,
    signedIn,
  };
}

const errorMessages: Record<string, string> = {
  AUTH_REQUIRED: "투표하려면 먼저 로그인해 주세요.",
  INVALID_CHOICE: "알 수 없는 선택입니다.",
  TOO_FAST: "잠시 후 다시 시도해 주세요.",
  VOTE_REQUIRED: "먼저 투표를 마친 뒤 코멘트를 남길 수 있습니다.",
  TOO_SHORT: "내용을 입력해 주세요.",
  TOO_LONG: "240자를 넘을 수 없습니다.",
  TOO_MANY_LINES: "3줄까지만 작성할 수 있습니다.",
  DUPLICATE: "같은 내용이 이미 등록되어 있습니다.",
  FORBIDDEN: "권한이 없습니다.",
};

export function humanError(message: string | undefined): string {
  if (!message) return "처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  for (const [code, text] of Object.entries(errorMessages)) {
    if (message.includes(code)) return text;
  }
  return message;
}

/** 투표. 같은 선택을 다시 보내면 취소된다. */
export async function castVote(billId: string, choice: Choice) {
  const sb = supabase();
  if (!sb) throw new Error("BACKEND_OFF");
  const { data, error } = await sb.rpc("cast_vote", { p_bill_id: billId, p_choice: choice });
  if (error) throw new Error(humanError(error.message));
  const row = Array.isArray(data) ? data[0] : data;
  return {
    unfit: Number(row?.unfit ?? 0),
    fit: Number(row?.fit ?? 0),
    difference: Number(row?.difference ?? 0),
    myChoice: (row?.my_choice as Choice | null) ?? null,
  };
}

export async function loadComments(billId: string): Promise<PublicComment[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data } = await sb
    .from("public_comments")
    .select("*")
    .eq("bill_id", billId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((r) => ({
    id: r.id,
    billId: r.bill_id,
    body: r.body,
    vote: r.vote,
    handle: r.handle,
    createdAt: r.created_at,
  }));
}

export async function postComment(billId: string, body: string) {
  const sb = supabase();
  if (!sb) throw new Error("BACKEND_OFF");
  const { error } = await sb.rpc("post_comment", { p_bill_id: billId, p_body: body });
  if (error) throw new Error(humanError(error.message));
}

/** 매직링크 로그인 — 비밀번호를 다루지 않는다. */
export async function signInWithEmail(email: string) {
  const sb = supabase();
  if (!sb) throw new Error("BACKEND_OFF");
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href },
  });
  if (error) throw new Error(error.message);
}

export { backendConfigured };
