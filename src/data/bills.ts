import type { Bill, OfficialSource } from "@/lib/types";

/**
 * ⚠️ 예시(SAMPLE) 데이터
 *
 * 아래 법안은 전부 화면 구조 검증용 가상 법안이다. 실존 의안번호·표결기록이 아니다.
 * 제작서 §1.1 / §30 원칙(“AI가 공식 FACT를 추측하여 생성”하지 않는다)에 따라,
 * 공식 API 연동 전까지 모든 레코드는 origin: "SAMPLE" 로 표시하고 화면에서도
 * 예시 데이터임을 고지한다.
 *
 * 실서비스 교체 지점:
 *   FACT     → 국회의안정보시스템 / 열린국회정보 / 전자관보 / 국가법령정보센터 API
 *   표결      → 본회의 표결정보 API
 *   헌재/판례 → 헌법재판소 결정례 / 대법원 판례정보
 */

const 의안정보 = (label: string): OfficialSource => ({
  agency: "국회의안정보시스템",
  label,
  url: "https://likms.assembly.go.kr/bill/main.do",
});

const 표결정보 = (label: string): OfficialSource => ({
  agency: "열린국회정보",
  label,
  url: "https://open.assembly.go.kr/portal/data/service/selectAPIServicePage.do",
});

const 회의록 = (label: string): OfficialSource => ({
  agency: "국회회의록",
  label,
  url: "https://likms.assembly.go.kr/record/",
});

const 법령정보 = (label: string): OfficialSource => ({
  agency: "국가법령정보센터",
  label,
  url: "https://www.law.go.kr/",
});

const 관보 = (label: string): OfficialSource => ({
  agency: "전자관보",
  label,
  url: "https://gwanbo.go.kr/",
});

const 헌재 = (label: string): OfficialSource => ({
  agency: "헌법재판소",
  label,
  url: "https://search.ccourt.go.kr/",
});

export const bills: Bill[] = [
  // ─────────────────────────────────────────────────────────────
  {
    id: "judicial-misapplication",
    origin: "SAMPLE",
    fact: {
      billNo: "2200101",
      title: "법관 및 검사의 법령 고의적용 위반 처벌에 관한 법률안",
      committee: "법제사법위원회",
      status: "PLENARY_PASSED",
      proposal: {
        kind: "의원발의",
        sponsorId: "l-11",
        coSponsorIds: [
          "l-12", "l-13", "l-14", "l-15", "l-16", "l-17", "l-18", "l-19", "l-20",
          "l-21", "l-23", "l-25", "l-32",
        ],
        proposedAt: "2026-06-04",
        officialReasonExcerpt:
          "현행법상 법관 또는 검사가 직무를 수행하면서 법령을 고의로 잘못 적용한 경우에도 이를 직접 규율하는 처벌규정이 없어, 사법작용에 대한 국민의 신뢰가 저하되고 있다는 지적이 있음. 이에 법관 또는 검사가 일정한 목적을 가지고 법령을 고의로 위반하여 적용한 경우 형사처벌할 수 있도록 하려는 것임.",
        officialReasonSource: 의안정보("제안이유 및 주요내용"),
      },
      events: [
        { date: "2026-06-04", label: "발의", source: 의안정보("의안 접수정보") },
        { date: "2026-06-05", label: "법제사법위원회 회부", source: 의안정보("위원회 회부") },
        { date: "2026-07-14", label: "법안심사제1소위원회 심사", source: 회의록("소위 회의록") },
        { date: "2026-08-02", label: "위원회 수정가결", detail: "위원회 대안으로 통합 심사", source: 회의록("심사보고서") },
        { date: "2026-08-10", label: "본회의 가결", source: 표결정보("본회의 표결정보") },
        { date: "2026-08-18", label: "정부 이송", source: 의안정보("의안 처리경과") },
      ],
      vote: {
        date: "2026-08-10",
        sessionLabel: "제000회 국회(임시회) 제0차 본회의",
        result: "가결",
        for: [
          "l-11", "l-12", "l-13", "l-14", "l-15", "l-16", "l-17", "l-18", "l-19", "l-20",
          "l-21", "l-22", "l-23", "l-25", "l-26", "l-32",
        ],
        against: ["l-01", "l-02", "l-03", "l-05", "l-27", "l-29", "l-33"],
        abstain: ["l-24", "l-30"],
        absent: ["l-04", "l-06", "l-07", "l-08", "l-09", "l-10", "l-28", "l-31", "l-34"],
        source: 표결정보("본회의 표결정보"),
      },
      courtStatus: "NONE",
      sources: [
        의안정보("의안 원문 및 처리경과"),
        회의록("법제사법위원회 검토보고서"),
        표결정보("본회의 표결정보"),
      ],
    },
    summary: {
      whatItIs:
        "판사나 검사가 일정한 목적을 가지고 법을 고의로 잘못 적용한 경우 형사처벌할 수 있도록 하는 법입니다.",
      whyMade:
        "공식 제안이유에는 사법작용에 대한 국민의 신뢰가 낮아졌다는 지적이 있어 고의적인 법령 오적용을 직접 처벌하려 한다고 적혀 있습니다.",
    },
    opinion: {
      unfit: 12481,
      fit: 7932,
      triggeredAt: "2026-08-22T18:10:00+09:00",
      triggerSnapshot: { unfit: 11002, fit: 10002, difference: 1000, verifiedVoterCount: 21004 },
      updatedAt: "2026-08-22T21:40:00+09:00",
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "online-false-info",
    origin: "SAMPLE",
    fact: {
      billNo: "2200147",
      title: "정보통신망 이용촉진 및 정보보호 등에 관한 법률 일부개정법률안",
      committee: "과학기술정보방송통신위원회",
      status: "COMMITTEE_PASSED",
      proposal: {
        kind: "의원발의",
        sponsorId: "l-16",
        coSponsorIds: ["l-11", "l-14", "l-18", "l-19", "l-20", "l-22", "l-24", "l-26", "l-30"],
        proposedAt: "2026-05-19",
        officialReasonExcerpt:
          "정보통신망을 통하여 유통되는 허위의 정보로 인한 피해가 증가하고 있으나 현행 제도로는 신속한 유통 차단이 어렵다는 지적이 있음. 이에 일정한 요건에 해당하는 정보에 대하여 정보통신서비스 제공자가 임시조치를 하도록 하고, 이를 이행하지 아니한 경우 과징금을 부과할 수 있도록 하려는 것임.",
        officialReasonSource: 의안정보("제안이유 및 주요내용"),
      },
      events: [
        { date: "2026-05-19", label: "발의", source: 의안정보("의안 접수정보") },
        { date: "2026-05-20", label: "과학기술정보방송통신위원회 회부", source: 의안정보("위원회 회부") },
        { date: "2026-06-30", label: "정보통신방송법안심사소위 심사", source: 회의록("소위 회의록") },
        { date: "2026-08-14", label: "위원회 수정가결", source: 회의록("심사보고서") },
      ],
      courtStatus: "NONE",
      sources: [의안정보("의안 원문 및 처리경과"), 회의록("위원회 검토보고서")],
    },
    summary: {
      whatItIs:
        "인터넷에 올라온 정보가 허위라고 판단되면 사업자가 먼저 가려 두도록 하고, 따르지 않으면 과징금을 물리는 법입니다.",
      whyMade:
        "공식 제안이유에는 허위정보로 인한 피해가 늘고 있는데 현행 제도로는 빠르게 차단하기 어렵다고 적혀 있습니다.",
    },
    opinion: {
      unfit: 9820,
      fit: 8913,
      updatedAt: "2026-08-22T21:40:00+09:00",
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "assembly-report",
    origin: "SAMPLE",
    fact: {
      billNo: "2200233",
      title: "집회 및 시위에 관한 법률 일부개정법률안",
      committee: "행정안전위원회",
      status: "PENDING",
      proposal: {
        kind: "의원발의",
        sponsorId: "l-13",
        coSponsorIds: ["l-11", "l-12", "l-15", "l-17", "l-19", "l-32", "l-33"],
        proposedAt: "2026-07-08",
        officialReasonExcerpt:
          "주요 도로에서의 집회로 인한 교통 불편 민원이 지속되고 있음. 이에 일정 규모 이상의 집회에 대하여 사전 신고사항을 확대하고, 신고 내용과 다르게 진행된 경우의 해산요건을 구체화하려는 것임.",
        officialReasonSource: 의안정보("제안이유 및 주요내용"),
      },
      events: [
        { date: "2026-07-08", label: "발의", source: 의안정보("의안 접수정보") },
        { date: "2026-07-09", label: "행정안전위원회 회부", source: 의안정보("위원회 회부") },
      ],
      courtStatus: "NONE",
      sources: [의안정보("의안 원문 및 처리경과")],
    },
    summary: {
      whatItIs:
        "일정 규모 이상 집회를 열 때 미리 알려야 할 내용을 늘리고, 신고와 다르게 진행되면 해산할 수 있는 요건을 구체화하는 법입니다.",
      whyMade:
        "공식 제안이유에는 주요 도로 집회로 인한 교통 불편 민원이 계속되고 있다고 적혀 있습니다.",
    },
    opinion: {
      unfit: 3844,
      fit: 3901,
      updatedAt: "2026-08-22T21:40:00+09:00",
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "platform-fee-cap",
    origin: "SAMPLE",
    fact: {
      billNo: "2200088",
      title: "온라인플랫폼 중개거래의 공정화에 관한 법률안",
      committee: "정무위원회",
      status: "PROMULGATED",
      proposal: {
        kind: "정부제출",
        coSponsorIds: [],
        proposedAt: "2026-03-11",
        officialReasonExcerpt:
          "온라인플랫폼 중개거래에서 입점사업자와 플랫폼 사업자 간 협상력 격차로 인한 불공정거래 우려가 제기되고 있음. 이에 중개수수료 산정기준의 공개, 계약서 필수기재사항 등을 정하여 거래의 투명성을 확보하려는 것임.",
        officialReasonSource: 의안정보("정부 제출 제안이유"),
      },
      events: [
        { date: "2026-03-11", label: "정부 제출", source: 의안정보("의안 접수정보") },
        { date: "2026-03-12", label: "정무위원회 회부", source: 의안정보("위원회 회부") },
        { date: "2026-05-21", label: "위원회 대안 반영 폐기 후 대안 가결", source: 회의록("심사보고서") },
        { date: "2026-06-15", label: "본회의 가결", source: 표결정보("본회의 표결정보") },
        { date: "2026-06-24", label: "정부 이송", source: 의안정보("의안 처리경과") },
        { date: "2026-07-02", label: "공포", detail: "법률 제00000호", source: 관보("관보 게재") },
      ],
      vote: {
        date: "2026-06-15",
        sessionLabel: "제000회 국회(정기회) 제0차 본회의",
        result: "가결",
        for: [
          "l-01", "l-02", "l-03", "l-04", "l-05", "l-06", "l-07", "l-09", "l-10",
          "l-11", "l-12", "l-14", "l-16", "l-18", "l-21", "l-22", "l-23", "l-24",
          "l-25", "l-26", "l-27", "l-29", "l-30",
        ],
        against: ["l-28", "l-31"],
        abstain: ["l-33"],
        absent: ["l-08", "l-13", "l-15", "l-17", "l-19", "l-20", "l-32", "l-34"],
        source: 표결정보("본회의 표결정보"),
      },
      promulgatedAt: "2026-07-02",
      effectiveAt: "2027-01-02",
      courtStatus: "NONE",
      sources: [의안정보("의안 원문 및 처리경과"), 관보("공포 관보"), 법령정보("법률 본문")],
    },
    summary: {
      whatItIs:
        "온라인 플랫폼이 입점 사업자에게 받는 수수료의 산정 기준을 공개하고, 계약서에 꼭 넣어야 할 내용을 정하는 법입니다.",
      whyMade:
        "공식 제안이유에는 플랫폼과 입점사업자 사이의 협상력 차이 때문에 불공정거래 우려가 있다고 적혀 있습니다.",
    },
    opinion: {
      unfit: 1802,
      fit: 4410,
      updatedAt: "2026-08-22T21:40:00+09:00",
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "employment-restriction",
    origin: "SAMPLE",
    fact: {
      billNo: "2100412",
      title: "특정범죄 전력자의 취업제한에 관한 특례법 일부개정법률",
      committee: "보건복지위원회",
      status: "IN_FORCE",
      proposal: {
        kind: "위원회대안",
        coSponsorIds: [],
        committeeAlternativeBy: "보건복지위원장",
        proposedAt: "2025-04-02",
        officialReasonExcerpt:
          "특정범죄 전력자의 재범을 방지하고 이용자를 보호하기 위하여 관련 기관에의 취업을 일정 기간 제한할 필요가 있음. 이에 취업제한 대상 기관과 제한기간을 정하려는 것임.",
        officialReasonSource: 의안정보("위원회 대안 제안이유"),
      },
      events: [
        { date: "2025-04-02", label: "위원회 대안 제안", source: 의안정보("의안 접수정보") },
        { date: "2025-04-29", label: "본회의 가결", source: 표결정보("본회의 표결정보") },
        { date: "2025-05-20", label: "공포", source: 관보("관보 게재") },
        { date: "2025-11-20", label: "시행", source: 법령정보("법률 본문 및 시행일") },
        {
          date: "2026-06-25",
          label: "헌법재판소 헌법불합치 결정",
          detail: "개정 시한까지 계속 적용",
          source: 헌재("결정 요지"),
        },
      ],
      vote: {
        date: "2025-04-29",
        sessionLabel: "제000회 국회(임시회) 제0차 본회의",
        result: "가결",
        for: [
          "l-01", "l-02", "l-03", "l-05", "l-06", "l-07", "l-09", "l-11", "l-12",
          "l-13", "l-14", "l-15", "l-16", "l-17", "l-19", "l-20", "l-21", "l-23",
          "l-25", "l-27", "l-29", "l-30", "l-32", "l-33",
        ],
        against: ["l-22"],
        abstain: ["l-26", "l-28"],
        absent: ["l-04", "l-08", "l-10", "l-18", "l-24", "l-31", "l-34"],
        source: 표결정보("본회의 표결정보"),
      },
      promulgatedAt: "2025-05-20",
      effectiveAt: "2025-11-20",
      courtStatus: "NONCONFORMING",
      courtCaseNo: "예시 — 실제 사건번호로 교체 필요",
      sources: [의안정보("의안 원문 및 처리경과"), 법령정보("법률 본문"), 헌재("결정문 원문")],
    },
    summary: {
      whatItIs:
        "특정 범죄로 처벌받은 사람이 일정 기간 관련 기관에 취업하지 못하도록 제한하는 법입니다.",
      whyMade:
        "공식 제안이유에는 재범을 막고 이용자를 보호하기 위한 것이라고 적혀 있습니다.",
    },
    opinion: {
      unfit: 5210,
      fit: 6870,
      updatedAt: "2026-08-22T21:40:00+09:00",
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "election-district",
    origin: "SAMPLE",
    fact: {
      billNo: "2200310",
      title: "공직선거법 일부개정법률안",
      committee: "정치개혁특별위원회",
      status: "PENDING",
      proposal: {
        kind: "의원발의",
        sponsorId: "l-27",
        coSponsorIds: ["l-28", "l-29", "l-30", "l-31", "l-24", "l-26", "l-34"],
        proposedAt: "2026-08-05",
        officialReasonExcerpt:
          "선거구 간 인구편차로 인한 표의 등가성 문제가 지속적으로 제기되고 있음. 이에 선거구 획정의 기준과 절차를 법률에 구체적으로 정하려는 것임.",
        officialReasonSource: 의안정보("제안이유 및 주요내용"),
      },
      events: [
        { date: "2026-08-05", label: "발의", source: 의안정보("의안 접수정보") },
        { date: "2026-08-06", label: "정치개혁특별위원회 회부", source: 의안정보("위원회 회부") },
      ],
      courtStatus: "NONE",
      sources: [의안정보("의안 원문 및 처리경과")],
    },
    summary: {
      whatItIs:
        "국회의원 선거구를 어떤 기준과 절차로 나눌지를 법률에 더 구체적으로 정하는 법입니다.",
      whyMade:
        "공식 제안이유에는 선거구마다 인구 차이가 커서 한 표의 가치가 달라지는 문제가 있다고 적혀 있습니다.",
    },
    opinion: {
      unfit: 980,
      fit: 1240,
      updatedAt: "2026-08-22T21:40:00+09:00",
    },
  },

  // ─────────────────────────────────────────────────────────────
  {
    id: "public-record-access",
    origin: "SAMPLE",
    fact: {
      billNo: "2200275",
      title: "공공기관의 정보공개에 관한 법률 일부개정법률안",
      committee: "행정안전위원회",
      status: "EFFECTIVE_SCHEDULED",
      proposal: {
        kind: "의원발의",
        sponsorId: "l-06",
        coSponsorIds: ["l-01", "l-02", "l-04", "l-07", "l-08", "l-10", "l-22", "l-26", "l-29"],
        proposedAt: "2026-04-16",
        officialReasonExcerpt:
          "정보공개 청구에 대한 비공개 결정 사유가 포괄적으로 운용되고 있다는 지적이 있음. 이에 비공개 대상 정보의 범위를 구체화하고, 부분공개 원칙을 명시하려는 것임.",
        officialReasonSource: 의안정보("제안이유 및 주요내용"),
      },
      events: [
        { date: "2026-04-16", label: "발의", source: 의안정보("의안 접수정보") },
        { date: "2026-04-17", label: "행정안전위원회 회부", source: 의안정보("위원회 회부") },
        { date: "2026-06-11", label: "위원회 수정가결", source: 회의록("심사보고서") },
        { date: "2026-06-29", label: "본회의 가결", source: 표결정보("본회의 표결정보") },
        { date: "2026-07-16", label: "공포", source: 관보("관보 게재") },
        { date: "2027-01-16", label: "시행 예정", source: 법령정보("부칙 시행일") },
      ],
      vote: {
        date: "2026-06-29",
        sessionLabel: "제000회 국회(정기회) 제0차 본회의",
        result: "가결",
        for: [
          "l-01", "l-02", "l-04", "l-05", "l-06", "l-07", "l-08", "l-09", "l-10",
          "l-21", "l-22", "l-24", "l-25", "l-26", "l-27", "l-28", "l-29", "l-30",
          "l-31", "l-34",
        ],
        against: [],
        abstain: ["l-13", "l-17"],
        absent: ["l-03", "l-11", "l-12", "l-14", "l-15", "l-16", "l-18", "l-19", "l-20", "l-23", "l-32", "l-33"],
        source: 표결정보("본회의 표결정보"),
      },
      promulgatedAt: "2026-07-16",
      effectiveAt: "2027-01-16",
      courtStatus: "NONE",
      sources: [의안정보("의안 원문 및 처리경과"), 관보("공포 관보"), 법령정보("법률 본문")],
    },
    summary: {
      whatItIs:
        "공공기관이 정보공개 요청을 거부할 수 있는 사유를 좁히고, 일부라도 공개할 수 있으면 공개하도록 하는 법입니다.",
      whyMade:
        "공식 제안이유에는 비공개 결정 사유가 지나치게 포괄적으로 쓰이고 있다는 지적이 있다고 적혀 있습니다.",
    },
    opinion: {
      unfit: 410,
      fit: 2980,
      updatedAt: "2026-08-22T21:40:00+09:00",
    },
  },
];

const billMap = new Map(bills.map((b) => [b.id, b]));

export function getBill(id: string): Bill | undefined {
  return billMap.get(id);
}
