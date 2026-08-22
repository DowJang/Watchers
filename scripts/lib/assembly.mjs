/**
 * 열린국회정보 (open.assembly.go.kr) OPEN API 클라이언트.
 *
 * 인증키는 https://open.assembly.go.kr 에서 발급받아
 * GitHub Secrets 의 ASSEMBLY_API_KEY 로 넣는다.
 *
 * 응답 봉투가 모든 서비스에서 동일하다.
 *   { "<SERVICE_ID>": [ { "head": [ {"list_total_count": N}, {"RESULT": {...}} ] },
 *                       { "row": [ {...}, {...} ] } ] }
 * 또는 오류 시
 *   { "RESULT": { "CODE": "INFO-200", "MESSAGE": "해당하는 데이터가 없습니다." } }
 */

const BASE = "https://open.assembly.go.kr/portal/openapi";

/**
 * 서비스 ID.
 *
 * ⚠️ 포털에서 서비스가 개편되면 ID 가 바뀔 수 있다. `npm run sync:probe` 로
 * 실제 응답과 필드명을 먼저 확인한 뒤 매핑을 확정하는 것을 전제로 한다.
 * 환경변수로 덮어쓸 수 있다.
 */
export const SERVICES = {
  /** 의안정보 — 발의 법률안 목록 */
  bills: process.env.ASSEMBLY_SVC_BILLS ?? "nzmimeepazxkubdpn",
  /**
   * 국회의원 본회의 표결정보 — 의원별 찬성/반대/기권.
   * (주의: "의안별 표결현황"(ncocpgfiaoituanbr)은 의안당 찬반 합계만 주는 다른 서비스다.
   *  이 서비스는 BILL_ID 가 필수 인자이므로 의안 하나씩 조회해야 한다 — sync.mjs 의
   *  fetchVotesPerBill 참고.)
   */
  votes: process.env.ASSEMBLY_SVC_VOTES ?? "nojepdqqaweusdfbi",
  /** 국회의원 인적사항 */
  members: process.env.ASSEMBLY_SVC_MEMBERS ?? "nwvrqwxyaytdsfvhu",
};

/** 일시적 네트워크 오류(타임아웃·연결 리셋)에 대비해 짧게 재시도한다. */
async function fetchWithRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      try {
        return await fetch(url, { headers: { accept: "application/json" }, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

export class AssemblyApiError extends Error {
  constructor(message, { service, code, status } = {}) {
    super(message);
    this.name = "AssemblyApiError";
    this.service = service;
    this.code = code;
    this.status = status;
  }
}

function apiKey() {
  const key = process.env.ASSEMBLY_API_KEY;
  if (!key) {
    throw new AssemblyApiError(
      "ASSEMBLY_API_KEY 가 설정되지 않았습니다. 열린국회정보에서 인증키를 발급받아 등록하세요.",
    );
  }
  return key;
}

/**
 * 서비스 한 페이지를 가져온다.
 * @returns {Promise<{rows: object[], total: number, raw: object}>}
 */
export async function fetchPage(service, { pIndex = 1, pSize = 100, params = {} } = {}) {
  const url = new URL(`${BASE}/${service}`);
  url.searchParams.set("KEY", apiKey());
  url.searchParams.set("Type", "json");
  url.searchParams.set("pIndex", String(pIndex));
  url.searchParams.set("pSize", String(pSize));
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  let res;
  try {
    res = await fetchWithRetry(url);
  } catch (e) {
    // Node 의 fetch 는 원인을 e.cause 에 감춘다("fetch failed" 만 보이면 원인을 알 수 없다).
    const cause = e?.cause ? ` — 원인: ${e.cause.code ?? e.cause.message ?? e.cause}` : "";
    throw new AssemblyApiError(`네트워크 요청 실패: ${e.message}${cause}`, { service });
  }
  if (!res.ok) {
    throw new AssemblyApiError(`HTTP ${res.status}`, { service, status: res.status });
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    // 키가 틀리면 JSON 이 아닌 "Bad Request." 같은 평문이 온다.
    throw new AssemblyApiError(`JSON 이 아닌 응답: ${text.slice(0, 120)}`, { service });
  }

  // 데이터 없음 / 인증 실패 등
  if (json.RESULT) {
    const { CODE, MESSAGE } = json.RESULT;
    if (CODE === "INFO-200") return { rows: [], total: 0, raw: json }; // 해당 데이터 없음
    throw new AssemblyApiError(`${CODE}: ${MESSAGE}`, { service, code: CODE });
  }

  const envelope = json[service];
  if (!Array.isArray(envelope)) {
    throw new AssemblyApiError(
      `예상과 다른 응답 구조입니다. 서비스 ID(${service})를 확인하세요.`,
      { service },
    );
  }

  const head = envelope.find((e) => e && Array.isArray(e.head))?.head ?? [];
  const total = head.find((h) => typeof h?.list_total_count === "number")?.list_total_count ?? 0;
  const result = head.find((h) => h?.RESULT)?.RESULT;
  if (result && result.CODE && !String(result.CODE).startsWith("INFO-000")) {
    if (result.CODE === "INFO-200") return { rows: [], total: 0, raw: json };
    throw new AssemblyApiError(`${result.CODE}: ${result.MESSAGE}`, { service, code: result.CODE });
  }

  const rows = envelope.find((e) => e && Array.isArray(e.row))?.row ?? [];
  return { rows, total, raw: json };
}

/** 여러 페이지를 이어서 모두 가져온다. */
export async function fetchAll(service, { pSize = 100, maxPages = 50, params = {} } = {}) {
  const out = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const { rows, total } = await fetchPage(service, { pIndex: page, pSize, params });
    out.push(...rows);
    if (rows.length < pSize || out.length >= total) break;
  }
  return out;
}

/**
 * 서비스마다 필수 파라미터가 다르고 개편에 따라 바뀐다.
 * 후보 파라미터 조합을 순서대로 시도하고, 처음으로 성공한 조합의 결과를 돌려준다.
 *
 * ERROR-300(필수값 누락)은 "이 조합은 아니다"라는 뜻이므로 다음 후보로 넘어가고,
 * 인증 실패처럼 조합과 무관한 오류는 그대로 던진다.
 */
export async function fetchAllTrying(service, paramSets, { pSize = 100, maxPages = 50 } = {}) {
  const attempts = [];
  for (const params of paramSets) {
    try {
      const rows = await fetchAll(service, { pSize, maxPages, params });
      return { rows, params, attempts };
    } catch (e) {
      const retryable = e instanceof AssemblyApiError && /ERROR-300|ERROR-336|INFO-300/.test(e.code ?? e.message);
      attempts.push({ params, error: e.message });
      if (!retryable) throw e;
    }
  }
  const err = new AssemblyApiError(
    `필수 파라미터를 찾지 못했습니다. 시도한 조합: ${attempts.map((a) => JSON.stringify(a.params)).join(" / ")}`,
    { service, code: "ERROR-300" },
  );
  err.attempts = attempts;
  throw err;
}
