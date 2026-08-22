"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "홈", icon: HomeIcon },
  { href: "/bills", label: "법안", icon: DocIcon },
  { href: "/constitution", label: "헌법", icon: ScaleIcon },
  { href: "/legislators", label: "의원", icon: PeopleIcon },
  { href: "/transparency", label: "투명성", icon: ShieldIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 데스크톱: 헤더 가로 내비게이션 */
export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="주요 메뉴">
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className="rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
            style={{
              color: active ? "var(--text)" : "var(--text-2)",
              background: active ? "var(--surface-2)" : "transparent",
            }}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** 모바일: 하단 탭 바 (기본 형태) */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden border-t backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--surface) 92%, transparent)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className="flex h-15 flex-col items-center justify-center gap-1 py-2 text-[0.6875rem] font-semibold"
                style={{ color: active ? "var(--text)" : "var(--text-3)" }}
              >
                <Icon active={active} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------- 아이콘 (외부 의존 없이 인라인 SVG) ---------- */

type IconProps = { active?: boolean };
const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function HomeIcon({ active }: IconProps) {
  return (
    <svg {...base} strokeWidth={active ? 2.2 : 1.7}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

function DocIcon({ active }: IconProps) {
  return (
    <svg {...base} strokeWidth={active ? 2.2 : 1.7}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function ScaleIcon({ active }: IconProps) {
  return (
    <svg {...base} strokeWidth={active ? 2.2 : 1.7}>
      <path d="M12 4v16M7 20h10" />
      <path d="M4 8h16" />
      <path d="M4 8 1.8 13h4.4zM20 8l-2.2 5h4.4z" />
    </svg>
  );
}

function PeopleIcon({ active }: IconProps) {
  return (
    <svg {...base} strokeWidth={active ? 2.2 : 1.7}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6M17 14.4a5.5 5.5 0 0 1 3.5 4.6" />
    </svg>
  );
}

function ShieldIcon({ active }: IconProps) {
  return (
    <svg {...base} strokeWidth={active ? 2.2 : 1.7}>
      <path d="M12 3 5 6v6c0 4 3 7.4 7 9 4-1.6 7-5 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
