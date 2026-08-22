import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { DesktopNav, MobileTabBar } from "@/components/Nav";
import { SITE, siteMeta } from "@/lib/site";
import { dt } from "@/lib/format";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.slogan}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    title: `${SITE.name} — ${SITE.slogan}`,
    description: SITE.description,
    type: "website",
    locale: "ko_KR",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e16" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          본문으로 건너뛰기
        </a>

        <Header />

        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 md:pb-16 md:pt-6 lg:px-6">
          {children}
        </main>

        <Footer />
        <MobileTabBar />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 lg:px-6">
        <Link href="/" className="flex shrink-0 items-baseline gap-2">
          <span className="text-lg font-black tracking-tight md:text-xl">{SITE.name}</span>
          <span className="hidden text-xs font-medium text-faint lg:inline">{SITE.description}</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <DesktopNav />
        </div>
      </div>

      {/* 제작서 §24 — 공식자료 최종 확인 시각 상시 노출 */}
      <div
        className="border-t px-4 py-1.5 text-[0.6875rem] lg:px-6"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-dim">
            공식자료 최종 확인 <strong className="font-bold tabular-nums">{dt(siteMeta.lastSyncedAt)}</strong>
          </span>
          {siteMeta.dataOrigin === "SAMPLE" ? (
            <span
              className="rounded px-1.5 py-0.5 font-extrabold"
              style={{ background: "var(--opinion-bg)", color: "var(--opinion-fg)" }}
            >
              예시 데이터 — 공식 API 연동 전
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer
      className="mt-8 border-t pb-24 pt-8 md:pb-10"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 lg:px-6">
        <p className="text-base font-extrabold">{SITE.name}</p>
        <p className="mt-1 max-w-prose text-sm text-dim">{SITE.description}</p>

        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold" aria-label="푸터 메뉴">
          <Link href="/bills">법안</Link>
          <Link href="/constitution">헌법</Link>
          <Link href="/legislators">의원</Link>
          <Link href="/transparency">투명성</Link>
        </nav>

        {/* 제작서 §39 — 법적 구현상 반드시 유지할 고지 */}
        <ul className="mt-5 space-y-1 border-t pt-4 text-xs leading-relaxed text-faint">
          <li>· 이 사이트의 시민 헌법의견투표는 법적 효력을 가지는 국민투표가 아닙니다.</li>
          <li>· 투표 결과는 헌법재판소의 결정이 아니며, 위헌 여부는 헌법재판소의 결정으로만 확정됩니다.</li>
          <li>· 감시자들의 분석(ANALYSIS)은 국가기관의 공식 판단이 아닙니다.</li>
          <li>· 시민 투표·코멘트는 공식 국가기록과 화면에서 완전히 분리하여 표시합니다.</li>
        </ul>
      </div>
    </footer>
  );
}
