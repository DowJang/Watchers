import type { Legislator, Party } from "@/lib/types";

/**
 * ⚠️ 예시(SAMPLE) 데이터
 *
 * 아래 정당·의원은 화면 구조 확인용 가상 데이터다.
 * 실제 서비스에서는 열린국회정보 / 국회 공식 의원 정보 API 로 전면 교체한다.
 * 실존 정당·의원 이름을 사용하지 않는 이유는 제작서 §1.1 (공식 기록에 없는
 * 사실은 사실로 표시하지 않는다) 원칙을 개발 단계에서도 지키기 위해서다.
 */

export const parties: Party[] = [
  { id: "p-garam", name: "가람당", color: "#2f6fd0" },
  { id: "p-naru", name: "나루당", color: "#c0392b" },
  { id: "p-daon", name: "다온당", color: "#1f8a5b" },
  { id: "p-mirae", name: "미래연대", color: "#7a4bbd" },
  { id: "p-indep", name: "무소속", color: "#6b7280" },
];

const raw: Array<[string, string, string, string]> = [
  // [id, 이름, 정당 id, 선거구]
  ["l-01", "강도현", "p-garam", "서울 종로"],
  ["l-02", "권세라", "p-garam", "서울 강서갑"],
  ["l-03", "김민준", "p-garam", "부산 해운대을"],
  ["l-04", "김서윤", "p-garam", "비례대표"],
  ["l-05", "남기훈", "p-garam", "인천 남동갑"],
  ["l-06", "노유정", "p-garam", "경기 성남분당갑"],
  ["l-07", "문재호", "p-garam", "광주 서구을"],
  ["l-08", "박하늘", "p-garam", "비례대표"],
  ["l-09", "배성우", "p-garam", "대전 유성을"],
  ["l-10", "서지안", "p-garam", "경기 수원정"],

  ["l-11", "송민교", "p-naru", "대구 수성갑"],
  ["l-12", "신아람", "p-naru", "경북 포항북"],
  ["l-13", "안도훈", "p-naru", "울산 남구갑"],
  ["l-14", "양수진", "p-naru", "비례대표"],
  ["l-15", "오재원", "p-naru", "부산 사하을"],
  ["l-16", "유선혜", "p-naru", "충남 천안병"],
  ["l-17", "윤태경", "p-naru", "강원 원주갑"],
  ["l-18", "이가온", "p-naru", "비례대표"],
  ["l-19", "이도경", "p-naru", "경남 창원의창"],
  ["l-20", "임보라", "p-naru", "서울 송파병"],

  ["l-21", "장현우", "p-daon", "전북 전주을"],
  ["l-22", "정세린", "p-daon", "비례대표"],
  ["l-23", "조민혁", "p-daon", "전남 순천"],
  ["l-24", "주하영", "p-daon", "제주 제주갑"],
  ["l-25", "진서준", "p-daon", "충북 청주상당"],
  ["l-26", "차예린", "p-daon", "비례대표"],

  ["l-27", "최도윤", "p-mirae", "경기 고양정"],
  ["l-28", "표시현", "p-mirae", "비례대표"],
  ["l-29", "하지원", "p-mirae", "서울 노원병"],
  ["l-30", "한결", "p-mirae", "경기 부천을"],
  ["l-31", "허유진", "p-mirae", "비례대표"],

  ["l-32", "홍재민", "p-indep", "경기 안산단원갑"],
  ["l-33", "황보람", "p-indep", "대구 달서병"],
  ["l-34", "구본영", "p-indep", "세종특별자치시갑"],
];

export const legislators: Legislator[] = raw.map(([id, name, partyId, district]) => ({
  id,
  name,
  partyId,
  district,
  // 실제 데이터에서는 국회 공식 의원 페이지 URL 로 대체한다.
  officialUrl: "https://www.assembly.go.kr/portal/assm/assmTerm/memberList.do",
}));

const partyMap = new Map(parties.map((p) => [p.id, p]));
const legislatorMap = new Map(legislators.map((l) => [l.id, l]));

export function getParty(id: string): Party {
  return partyMap.get(id) ?? { id, name: "확인 필요", color: "#6b7280" };
}

export function getLegislator(id: string): Legislator | undefined {
  return legislatorMap.get(id);
}

/** 의원 id 목록을 정당별로 묶어 총계를 낸다 (§5.5 정당별 총계) */
export function groupByParty(ids: string[]): Array<{ party: Party; members: Legislator[] }> {
  const buckets = new Map<string, Legislator[]>();
  for (const id of ids) {
    const l = legislatorMap.get(id);
    if (!l) continue;
    const arr = buckets.get(l.partyId) ?? [];
    arr.push(l);
    buckets.set(l.partyId, arr);
  }
  return parties
    .filter((p) => buckets.has(p.id))
    .map((p) => ({
      party: p,
      members: (buckets.get(p.id) ?? []).sort((a, b) => a.name.localeCompare(b.name, "ko")),
    }));
}
