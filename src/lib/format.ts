/** 숫자 천단위 구분 */
export function n(v: number): string {
  return v.toLocaleString("ko-KR");
}

/** 부호 있는 숫자 (격차 표시용) */
export function signed(v: number): string {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${n(Math.abs(v))}`;
}

/** "2026-08-10" → "2026.08.10" */
export function d(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10).replaceAll("-", ".");
}

/** ISO 시각 → "2026.08.22 21:40 KST" (서버/클라 렌더 결과를 고정하기 위해 수동 포맷) */
export function dt(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return d(iso);
  return `${m[1]}.${m[2]}.${m[3]} ${m[4]}:${m[5]} KST`;
}

/** 백분율 (0 나눗셈 방어) */
export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}
