/**
 * 국가법령정보센터 (law.go.kr) OPEN API 클라이언트.
 *
 * 이 API 는 인증키 대신 신청 시 등록한 이메일 ID(OC 값)를 사용한다.
 * https://open.law.go.kr 에서 신청 후 GitHub Secrets 의 LAW_GO_KR_OC 로 넣는다.
 * 예) 이메일이 abc@gmail.com 이면 OC 는 "abc".
 *
 * 공포일·시행일 등 법률의 최종 상태를 확인하는 데 사용한다.
 */

const SEARCH = "https://www.law.go.kr/DRF/lawSearch.do";
const SERVICE = "https://www.law.go.kr/DRF/lawService.do";

export class LawApiError extends Error {
  constructor(message, extra = {}) {
    super(message);
    this.name = "LawApiError";
    Object.assign(this, extra);
  }
}

function oc() {
  const value = process.env.LAW_GO_KR_OC;
  if (!value) {
    throw new LawApiError("LAW_GO_KR_OC 가 설정되지 않았습니다. 국가법령정보 공동활용에서 신청하세요.");
  }
  return value;
}

async function call(endpoint, params) {
  const url = new URL(endpoint);
  url.searchParams.set("OC", oc());
  url.searchParams.set("type", "JSON");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new LawApiError(`HTTP ${res.status}`, { status: res.status });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new LawApiError(`JSON 이 아닌 응답: ${text.slice(0, 120)}`);
  }
  if (json.result && json.msg) throw new LawApiError(`${json.result}: ${json.msg}`);
  return json;
}

/** 법령명으로 검색해 공포일·시행일이 담긴 목록을 얻는다. */
export async function searchLaw(query, { display = 20, page = 1 } = {}) {
  const json = await call(SEARCH, { target: "law", query, display, page });
  const body = json.LawSearch ?? json.lawSearch ?? {};
  const rows = body.law ?? [];
  return Array.isArray(rows) ? rows : [rows];
}

/** 법령 상세 (법령ID 또는 법령일련번호 기준). */
export async function getLaw({ id, mst } = {}) {
  return call(SERVICE, { target: "law", ID: id, MST: mst });
}
