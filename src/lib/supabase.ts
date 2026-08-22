"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 시민 참여(투표·코멘트·Trigger)와 관리자 화면의 백엔드.
 *
 * 사이트 자체는 GitHub Pages 에 올라가는 정적 파일이므로 서버가 없다.
 * 실시간으로 변하는 데이터(§24 "시민 참여 = 실시간")는 Supabase 를 직접 호출해 처리한다.
 *
 * anon key 는 공개되어도 되는 값이다. 실제 권한 통제는 Postgres 의 RLS 정책과
 * SECURITY DEFINER 함수에서 이루어진다 (supabase/schema.sql 참고).
 * 서비스 롤 키는 절대 이 저장소에 넣지 않는다.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 백엔드가 연결되어 있는지. false 면 화면은 "로컬 데모" 모드로 동작한다. */
export const backendConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!backendConfigured) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

/** 백엔드 미연결 상태에서 화면이 공통으로 쓰는 안내 문구 */
export const BACKEND_OFF_NOTICE =
  "시민 참여 백엔드(Supabase)가 아직 연결되지 않았습니다. 아래 수치는 예시이며, 입력한 내용은 저장되지 않습니다.";
