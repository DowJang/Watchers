/**
 * 공식 API 응답 → 감시자들 도메인 타입 매핑.
 *
 * 원칙(제작서 §1.1, §3.A): 공식 응답에 없는 값은 만들어 넣지 않는다.
 * 매핑되지 않은 필드는 undefined 로 두고, 화면에서 "확인 필요"로 표시한다.
 *
 * ⚠️ 필드명은 서비스 개편에 따라 달라질 수 있어 후보 이름을 여러 개 시도한다.
 *    `npm run sync:probe` 로 실제 필드명을 확인한 뒤 후보 목록을 조정하면 된다.
 */

/** 여러 후보 키 중 처음으로 값이 있는 것을 고른다. */
export function pick(row, ...keys) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

/** "2026-06-04" / "20260604" / "2026.06.04" → "2026-06-04" */
export function toIsoDate(value) {
  if (!value) return undefined;
  const s = String(value).trim();
  const m = s.match(/(\d{4})[-.\/]?(\d{2})[-.\/]?(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

/** 공동발의자 문자열("홍길동,김철수") → 이름 배열 */
export function splitNames(value) {
  if (!value) return [];
  return String(value)
    .split(/[,;·\/]|\s{2,}/)
    .map((s) => s.replace(/\(.*?\)/g, "").trim())
    .filter((s) => s.length >= 2 && s.length <= 6);
}

/**
 * 국회 처리결과(PROC_RESULT) → BillStatus.
 * 공포·시행 여부는 국가법령정보센터 값으로 다시 덮어쓴다.
 */
export function toBillStatus(procResult, { promulgatedAt, effectiveAt, today } = {}) {
  const r = procResult ?? "";
  if (/폐기|철회|부결/.test(r)) return "DISCARDED";
  if (promulgatedAt) {
    if (effectiveAt && today && effectiveAt <= today) return "IN_FORCE";
    if (effectiveAt) return "EFFECTIVE_SCHEDULED";
    return "PROMULGATED";
  }
  if (/가결|통과/.test(r)) return "PLENARY_PASSED";
  if (/위원회|심사/.test(r)) return "COMMITTEE_PASSED";
  return "PENDING";
}

/** 표결 문자열 → VoteChoice. 불참은 명단에 없으므로 별도로 계산한다. */
export function toVoteChoice(value) {
  const v = value ?? "";
  if (/찬성/.test(v)) return "FOR";
  if (/반대/.test(v)) return "AGAINST";
  if (/기권/.test(v)) return "ABSTAIN";
  if (/불참|결석/.test(v)) return "ABSENT";
  return undefined;
}

/** 의안정보 row → { id, fact } 부분 (ANALYSIS 는 사람이 작성한다) */
export function mapBill(row) {
  const billNo = pick(row, "BILL_NO", "billNo", "BILL_NUM");
  const billId = pick(row, "BILL_ID", "billId") ?? billNo;
  if (!billId) return null;

  const proposedAt = toIsoDate(pick(row, "PROPOSE_DT", "PROPOSE_DATE", "proposeDt"));
  const procResult = pick(row, "PROC_RESULT", "PROC_RESULT_CD", "procResult");
  const detailUrl = pick(row, "DETAIL_LINK", "LINK_URL", "detailLink");
  const proposerRaw = pick(row, "PROPOSER", "RST_PROPOSER", "proposer");
  const coProposerRaw = pick(row, "PUBL_PROPOSER", "MEMBER_LIST", "publProposer");

  const kind = /정부/.test(proposerRaw ?? "")
    ? "정부제출"
    : /위원장|위원회/.test(proposerRaw ?? "")
      ? "위원회대안"
      : "의원발의";

  // 공포·시행일은 국가법령정보센터가 호출 서버의 고정 IP 등록을 요구해 Actions 에서 쓸 수 없다.
  // 국회 의안정보 응답에 들어 있는 날짜 필드에서 직접 뽑는다.
  const promulgatedAt = toIsoDate(
    pick(row, "ANNOUNCE_DT", "PUBL_DT", "PROM_DT", "PUBLIC_DT", "공포일자"),
  );
  const effectiveAt = toIsoDate(pick(row, "ENFORCE_DT", "ENF_DT", "시행일자"));

  return {
    id: slug(billId),
    origin: "OFFICIAL",
    officialKeys: { billId, billNo },
    fact: {
      promulgatedAt,
      effectiveAt,
      billNo: billNo ?? "확인 필요",
      title: pick(row, "BILL_NAME", "BILL_NM", "billName") ?? "확인 필요",
      committee: pick(row, "COMMITTEE", "CURR_COMMITTEE", "COMMITTEE_NM") ?? "확인 필요",
      status: toBillStatus(procResult, {}),
      proposal: {
        kind,
        sponsorName: kind === "의원발의" ? firstName(proposerRaw) : undefined,
        committeeAlternativeBy: kind === "위원회대안" ? proposerRaw : undefined,
        coSponsorNames: splitNames(coProposerRaw),
        proposedAt: proposedAt ?? "",
        // 「제안이유 및 주요내용」은 목록 API 에 없다. 상세 페이지에서 별도 수집한다.
        officialReasonExcerpt: "",
      },
      events: buildEvents(row),
      procResult,
      sources: detailUrl
        ? [{ agency: "국회의안정보시스템", label: "의안 원문 및 처리경과", url: detailUrl }]
        : [],
    },
  };
}

function firstName(value) {
  if (!value) return undefined;
  return String(value).replace(/의원.*$/, "").split(/[,;]/)[0].replace(/\(.*?\)/g, "").trim() || undefined;
}

/** 의안 row 에 들어 있는 날짜 필드들로 타임라인을 만든다. */
function buildEvents(row) {
  const candidates = [
    ["PROPOSE_DT", "발의"],
    ["COMMITTEE_DT", "위원회 회부"],
    ["COMMITTEE_PROC_DT", "위원회 의결"],
    ["LAW_SUBMIT_DT", "법제사법위원회 회부"],
    ["LAW_PROC_DT", "법제사법위원회 의결"],
    ["PROC_DT", "본회의 의결"],
  ];
  const events = [];
  for (const [key, label] of candidates) {
    const date = toIsoDate(row?.[key]);
    if (date) events.push({ date, label });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/** 표결정보 rows → 의안별 4분류 명단 */
export function mapVotes(rows) {
  const byBill = new Map();
  for (const row of rows) {
    const billId = pick(row, "BILL_ID", "billId");
    if (!billId) continue;
    const choice = toVoteChoice(pick(row, "RESULT_VOTE_MOD", "VOTE_RESULT", "resultVoteMod"));
    if (!choice) continue;
    const name = pick(row, "HG_NM", "MEMBER_NM", "hgNm");
    const party = pick(row, "POLY_NM", "PARTY_NM", "polyNm");
    if (!name) continue;

    const entry = byBill.get(billId) ?? {
      billId,
      date: toIsoDate(pick(row, "VOTE_DATE", "PROC_DT", "voteDate")),
      sessionLabel: pick(row, "SESSION_CD", "CURRENTS_CD", "DEGREE") ?? "",
      FOR: [],
      AGAINST: [],
      ABSTAIN: [],
      ABSENT: [],
    };
    entry[choice].push({ name, party });
    byBill.set(billId, entry);
  }
  return byBill;
}

/** 국회의원 인적사항 row → Legislator */
export function mapLegislator(row) {
  const name = pick(row, "HG_NM", "NAAS_NM", "MEMBER_NM");
  if (!name) return null;
  const code = pick(row, "MONA_CD", "NAAS_CD", "MEMBER_NO") ?? name;
  return {
    id: slug(code),
    name,
    partyName: pick(row, "POLY_NM", "PLPT_NM", "PARTY_NM") ?? "확인 필요",
    district: pick(row, "ORIG_NM", "ELECD_NM", "DISTRICT") ?? "비례대표",
    committee: pick(row, "CMIT_NM", "BLNG_CMIT_NM"),
    officialUrl: pick(row, "MEM_TITLE", "NAAS_PIC", "HOMEPAGE") ?? undefined,
    officialCode: code,
  };
}

/** URL 에 쓸 수 있는 안전한 slug */
export function slug(value) {
  return String(value)
    .trim()
    .replace(/[^A-Za-z0-9가-힣_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
