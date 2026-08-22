"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { backendConfigured, supabase } from "@/lib/supabase";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/system", label: "공식 데이터" },
  { href: "/admin/votes", label: "투표" },
  { href: "/admin/triggers", label: "Trigger" },
  { href: "/admin/review", label: "헌재 검토" },
  { href: "/admin/media", label: "언론 발송" },
  { href: "/admin/comments", label: "댓글" },
  { href: "/admin/audit", label: "Audit Log" },
];

type Session = { email: string; isAdmin: boolean } | null;

/**
 * 제작서 §17 — 관리자 페이지.
 *
 * ⚠️ 이 사이트는 GitHub Pages 에 올라가는 정적 파일이다. 서버가 없으므로
 *    "URL 을 모르게 한다"는 것은 접근통제가 아니다. 실제 통제는 두 층에서 이루어진다.
 *      1) Supabase 이메일 인증 + admin_users 테이블에 등록된 계정만 통과
 *      2) 데이터 자체는 Postgres RLS 로 보호 — 화면을 뚫어도 데이터는 읽히지 않는다
 *    백엔드 연결 전에는 화면 골격만 보이며, 그 사실을 화면에 명시한다.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<Session>(null);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    const sb = supabase();
    if (!sb) {
      setChecking(false);
      return;
    }
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      setSession(null);
      setChecking(false);
      return;
    }
    // 관리자 여부는 RLS 로 보호되는 테이블에서 확인한다.
    const { data: row } = await sb.from("admin_users").select("email").eq("id", user.id).maybeSingle();
    setSession({ email: user.email ?? "", isAdmin: Boolean(row) });
    setChecking(false);
  }, []);

  useEffect(() => {
    void refresh();
    const sb = supabase();
    const sub = sb?.auth.onAuthStateChange(() => void refresh());
    return () => sub?.data.subscription.unsubscribe();
  }, [refresh]);

  const locked = backendConfigured && !session?.isAdmin;

  return (
    <div className="pb-8">
      <header
        className="-mx-4 mb-5 border-b px-4 py-3 lg:-mx-6 lg:px-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href="/admin" className="text-base font-black tracking-tight">
            감시자들 <span style={{ color: "var(--text-3)" }}>ADMIN</span>
          </Link>
          <span
            className="rounded px-1.5 py-0.5 text-[0.625rem] font-extrabold"
            style={{
              background: backendConfigured ? "var(--fact-bg)" : "var(--opinion-bg)",
              color: backendConfigured ? "var(--fact-fg)" : "var(--opinion-fg)",
            }}
          >
            {backendConfigured ? "백엔드 연결됨" : "백엔드 미연결"}
          </span>
          <div className="ml-auto flex items-center gap-2 text-[0.8125rem]">
            {session?.email ? (
              <>
                <span className="text-dim">{session.email}</span>
                <button
                  type="button"
                  onClick={() => void supabase()?.auth.signOut()}
                  className="font-bold underline"
                  style={{ color: "var(--text-3)" }}
                >
                  로그아웃
                </button>
              </>
            ) : null}
            <Link href="/" className="font-bold" style={{ color: "var(--text-3)" }}>
              공개 사이트 →
            </Link>
          </div>
        </div>

        <nav
          aria-label="관리자 메뉴"
          className="no-scrollbar -mx-4 mt-3 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0"
        >
          {NAV.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className="shrink-0 rounded-lg px-3 py-1.5 text-[0.8125rem] font-bold"
                style={{
                  background: active ? "var(--color-fact)" : "var(--surface-2)",
                  color: active ? "#fff" : "var(--text-2)",
                }}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {checking ? (
        <p className="py-10 text-center text-sm text-dim">확인 중…</p>
      ) : locked ? (
        <SignIn />
      ) : (
        <>
          {!backendConfigured ? <BackendOffBanner /> : null}
          {children}
        </>
      )}
    </div>
  );
}

function BackendOffBanner() {
  return (
    <div
      className="mb-5 rounded-xl border-2 border-dashed p-4"
      style={{ borderColor: "var(--opinion-bd)", background: "var(--opinion-bg)" }}
    >
      <p className="text-sm font-extrabold" style={{ color: "var(--opinion-fg)" }}>
        백엔드가 연결되지 않아 접근통제가 걸려 있지 않습니다.
      </p>
      <p className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: "var(--text-2)" }}>
        지금은 이 주소를 아는 사람이면 누구나 이 화면을 볼 수 있습니다. 다만 이 화면이 보여 주는 값은
        공개 사이트에도 있는 공식 기록뿐이며, 시민 투표·댓글·감사로그 같은 실시간 데이터는 아직
        존재하지 않습니다. Supabase 를 연결하면 이메일 인증을 통과한 관리자 계정만 접근할 수 있게 되고,
        데이터는 Postgres RLS 로 보호됩니다.
      </p>
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = supabase();
    if (!sb) return;
    setBusy(true);
    setError(null);
    const { error: err } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-xl font-black">관리자 로그인</h1>
      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-dim">
        등록된 관리자 이메일로 일회용 로그인 링크를 보냅니다. 링크를 받은 뒤에도 admin_users 에 등록된
        계정만 화면에 들어올 수 있습니다.
      </p>

      {sent ? (
        <p
          className="mt-5 rounded-xl border p-4 text-sm"
          style={{ borderColor: "var(--fact-bd)", background: "var(--fact-bg)", color: "var(--fact-fg)" }}
        >
          로그인 링크를 보냈습니다. 메일함을 확인해 주세요.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5">
          <label htmlFor="admin-email" className="text-[0.8125rem] font-bold">
            이메일
          </label>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="surface mt-1 w-full rounded-xl px-3 py-2.5 outline-none"
            style={{ borderColor: "var(--border-strong)" }}
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
            style={{ background: "var(--color-fact)", color: "#fff" }}
          >
            {busy ? "보내는 중…" : "로그인 링크 받기"}
          </button>
          {error ? (
            <p className="mt-2 text-[0.8125rem] font-semibold" style={{ color: "var(--color-lv-void)" }}>
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
