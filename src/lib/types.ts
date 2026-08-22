/**
 * 감시자들 — 도메인 타입
 *
 * 데이터는 두 영역으로 완전히 분리한다.
 *   FACT    : 국가기관 공식 기록에서 확인되는 사실 (추측 생성 금지)
 *   OPINION : 방문자의 투표·코멘트 (공식 기록 아님)
 *
 * 이 사이트는 법안의 위헌 여부에 대해 감시자들 자체의 의견·논거·등급을 만들지 않는다.
 * 헌법적 판단은 오직 헌법재판소의 공식 결정(courtStatus, courtCaseNo — 모두 FACT)만
 * 사용한다. "쉬운 요약"(PlainSummary)은 공식 기록을 평가 없이 쉬운 말로 옮긴 것으로,
 * FACT 를 대체하지 않는 보조 표시일 뿐 헌법 판단이 아니다.
 *
 * 타입 단계에서 영역을 서로 다른 객체로 묶어, UI에서 섞여 렌더링되는 실수를
 * 구조적으로 막는다.
 */

export type Zone = "FACT" | "OPINION";

/** 데이터 신뢰 상태. 공식 API 연동 전에는 모든 레코드가 SAMPLE 이다. */
export type DataOrigin = "OFFICIAL" | "SAMPLE";

/** 제작서 §4 — 현재 상태 */
export type BillStatus =
  | "PENDING" // 계류
  | "COMMITTEE_PASSED" // 위원회 통과
  | "PLENARY_PASSED" // 본회의 가결
  | "PROMULGATED" // 공포
  | "EFFECTIVE_SCHEDULED" // 시행 예정
  | "IN_FORCE" // 시행 중
  | "DISCARDED"; // 폐기

/**
 * 법적 상태 (헌재 판단).
 * 이 값이 이 사이트가 표시하는 유일한 "위헌 여부" 신호다 — 감시자들 자체의 등급·판단은 없다.
 */
export type CourtStatus =
  | "NONE" // 헌재 판단 없음
  | "PENDING" // 심리 중
  | "CONSTITUTIONAL" // 합헌
  | "UNCONSTITUTIONAL" // 위헌
  | "NONCONFORMING" // 헌법불합치
  | "LIMITED_UNCONSTITUTIONAL"; // 한정위헌

/** 공식 원문 링크. 모든 FACT 항목은 가능한 한 이 링크를 동반한다. */
export interface OfficialSource {
  /** 발행 기관 — 제작서 §1.1 허용 출처만 사용 */
  agency:
    | "국회"
    | "국회의안정보시스템"
    | "열린국회정보"
    | "국회회의록"
    | "헌법재판소"
    | "대법원"
    | "국가법령정보센터"
    | "법제처"
    | "전자관보"
    | "대통령실";
  label: string;
  url: string;
  /** 공식 문서에 기재된 발행/확인 일자 (YYYY-MM-DD) */
  issuedAt?: string;
}

export interface Party {
  id: string;
  name: string;
  /** 목록·차트에서 정당을 구분하기 위한 표시색 (정치적 의미 없음) */
  color: string;
}

export interface Legislator {
  id: string;
  name: string;
  partyId: string;
  /** 선거구 (비례대표는 "비례대표") */
  district: string;
  /** 국회 공식 의원 페이지 */
  officialUrl?: string;
  committee?: string;
  terms?: number;
}

/** 제작서 §5.3 — 입법 진행경과 타임라인 1단계 */
export interface BillEvent {
  date: string; // YYYY-MM-DD
  label: string; // 예: "본회의 가결"
  detail?: string;
  source?: OfficialSource;
}

export type VoteChoice = "FOR" | "AGAINST" | "ABSTAIN" | "ABSENT";

/**
 * 제작서 §5.5 — 본회의 표결.
 * 찬성·반대·기권·불참 네 그룹을 완전히 분리해 보관한다.
 * 불참은 반대로 계산하지 않는다(§2.2).
 */
export interface PlenaryVote {
  date: string;
  /** 회의 차수 등 공식 표기 */
  sessionLabel: string;
  result: "가결" | "부결";
  for: string[]; // legislator id
  against: string[];
  abstain: string[];
  absent: string[];
  source?: OfficialSource;
}

/** 제작서 §2.2 — 발의 구조. 원안 대표발의 / 공동발의 / 위원회 대안을 분리한다. */
export interface Proposal {
  /** 정부 제출안인 경우 대표발의자가 없다 */
  kind: "의원발의" | "정부제출" | "위원회대안";
  sponsorId?: string; // 대표발의자
  coSponsorIds: string[]; // 공동발의자 전원
  /** 위원회 대안인 경우 최종안을 만든 주체 */
  committeeAlternativeBy?: string;
  proposedAt: string;
  /** 「제안이유 및 주요내용」 공식 원문 발췌 — 요약·윤색하지 않는다 */
  officialReasonExcerpt: string;
  officialReasonSource?: OfficialSource;
}

/** FACT 영역 — 공식 기록에서 그대로 옮긴 값만 담는다. */
export interface BillFact {
  billNo: string; // 의안번호
  title: string; // 공식 법안명
  committee: string; // 소관위원회
  status: BillStatus;
  proposal: Proposal;
  events: BillEvent[];
  vote?: PlenaryVote;
  promulgatedAt?: string; // 공포일
  effectiveAt?: string; // 시행일
  courtStatus: CourtStatus;
  /** 헌재 사건번호 (부여된 경우) */
  courtCaseNo?: string;
  sources: OfficialSource[];
  /**
   * 표결 API 가 찬성·반대·기권 명단만 제공하는 경우, 불참은 "전체 의원 − 표결 참여자"로
   * 계산한 추정값이다. 이 경우 화면에 추정임을 고지한다.
   */
  voteAbsentInferred?: boolean;
  /** 공식 시스템의 원본 키 (재동기화 시 매칭용) */
  officialKeys?: { billId: string; billNo?: string };
}

/** 헌법 조항 */
export interface ConstitutionArticle {
  id: string; // 예: "art-103"
  no: string; // 예: "제103조"
  title: string; // 예: "법관의 독립"
  text: string; // 헌법 원문
  plain: string; // 쉬운 설명
}

/**
 * 헌법상 일반 개념(명확성원칙, 과잉금지원칙 등)에 대한 사전적 설명.
 * 특정 법안과 연결하지 않는다 — /constitution 페이지의 일반 참고자료로만 쓴다.
 */
export interface Principle {
  id: string;
  term: string;
  plain: string;
}

/**
 * 쉬운 요약 — 공식 기록(법안명, 제안이유)을 평가·판단 없이 쉬운 말로 옮긴 것.
 * 헌법 판단이 아니며, 위헌 여부·충돌 정도에 대한 어떤 등급도 담지 않는다.
 * 사람이 작성하기 전까지 해당 법안은 이 필드가 없다(null) — 자동 생성하지 않는다.
 */
export interface PlainSummary {
  /** 무슨 법인가 — 1~2줄, 평가를 섞지 않는다 */
  whatItIs: string;
  /** 왜 만들었나 — 공식 제안이유를 쉬운 말로 옮긴 것 (판단·해석 추가 금지) */
  whyMade: string;
}

/** OPINION 영역 — 시민 헌법의견투표 집계 (공식 기록 아님) */
export interface CitizenVoteTally {
  unfit: number; // 부적합
  fit: number; // 적합
  /** 제작서 §10 — 1,000표 격차 Trigger */
  triggeredAt?: string;
  triggerSnapshot?: {
    unfit: number;
    fit: number;
    difference: number;
    verifiedVoterCount: number;
  };
  updatedAt: string;
}

export interface CitizenComment {
  id: string;
  billId: string;
  /** 익명 표시명 — 개인식별정보를 저장하지 않는다(§26) */
  handle: string;
  body: string; // 최대 3줄 / 240자 내외
  vote?: "UNFIT" | "FIT";
  createdAt: string;
  status: "VISIBLE" | "HIDDEN";
}

export interface Bill {
  id: string; // URL slug
  origin: DataOrigin;
  fact: BillFact;
  /** 사람이 작성하기 전에는 null. 없으면 화면은 공식 기록만으로 표시한다. */
  summary: PlainSummary | null;
  opinion: CitizenVoteTally;
}

/** 제작서 §25 — 오늘의 변경 */
export interface DailyChange {
  newBills: number;
  committeePassed: number;
  plenaryPassed: number;
  promulgated: number;
  inForce: number;
  courtDecisions: number;
}

export interface SiteMeta {
  /** 공식자료 최종 확인 시각 (§24) */
  lastSyncedAt: string;
  dataOrigin: DataOrigin;
  today: DailyChange;
}
