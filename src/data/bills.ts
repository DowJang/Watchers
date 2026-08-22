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
    analysis: {
      whatItIs:
        "판사나 검사가 일정한 목적을 가지고 법을 고의로 잘못 적용한 경우 형사처벌할 수 있도록 하는 법입니다.",
      whyMade:
        "공식 제안이유에는 사법작용에 대한 국민의 신뢰가 낮아졌다는 지적이 있어 고의적인 법령 오적용을 직접 처벌하려 한다고 적혀 있습니다.",
      coreIssue:
        "재판 결과를 이유로 판사를 형사처벌할 수 있게 되면 법관의 독립이 흔들릴 수 있고, ‘고의로 잘못 적용’의 범위가 불명확하다는 점이 쟁점입니다.",
      keywords: ["사법독립", "명확성원칙", "권력분립"],
      conflictLevel: "HIGH",
      articleIds: ["art-103", "art-106", "art-101", "art-13", "art-12"],
      principleIds: ["pr-judicial", "pr-clarity", "pr-separation", "pr-nulla"],
      argumentsAgainst: [
        "헌법 제103조는 법관이 헌법과 법률에 의하여 양심에 따라 독립하여 심판하도록 정한다. 재판에서의 법령 해석·적용을 형사처벌 대상으로 삼으면 판단 자체가 수사·기소의 대상이 되어 독립성이 약화될 수 있다.",
        "‘고의로 잘못 적용’이라는 구성요건은 해석의 폭이 넓다. 어떤 판단이 처벌 대상인지 일반인은 물론 법관도 예측하기 어려우면 명확성원칙(헌법 제12조·제13조)에 어긋난다는 지적이 가능하다.",
        "헌법 제106조는 탄핵 또는 금고 이상의 형에 의하지 않고는 법관을 파면할 수 없도록 신분을 두텁게 보장한다. 형사처벌 통로가 넓어지면 이 보장이 사실상 우회될 수 있다.",
        "상급심 불복·재심 등 기존 사법절차로 오판을 시정하는 제도가 이미 있으므로, 형벌이라는 가장 강한 수단이 필요한 최소한인지(과잉금지원칙) 다툴 여지가 있다.",
      ],
      argumentsFor: [
        "법관·검사의 직무상 고의 범죄를 처벌하는 것 자체가 금지되지는 않는다. 현행법에도 직권남용·직무유기 등 공무원 직무범죄 규정이 있으며, 그 연장선에서 입법재량이 인정될 수 있다.",
        "구성요건을 ‘고의’와 ‘일정한 목적’으로 좁게 한정하면, 단순한 법리 오해나 견해 차이는 처벌 대상에서 배제되어 명확성 문제를 완화할 수 있다.",
        "사법에 대한 신뢰 확보는 헌법이 예정한 정당한 공익이며, 어떤 수단을 택할지는 원칙적으로 입법부의 형성권에 속한다(헌법 제40조).",
      ],
      cases: [
        {
          court: "헌법재판소",
          caseNo: "예시 — 실제 사건번호로 교체 필요",
          title: "형벌조항의 명확성원칙 심사 기준",
          summary:
            "형벌법규의 구성요건은 통상의 판단능력을 가진 사람이 무엇이 금지되는지 알 수 있을 정도로 규정되어야 한다는 취지의 결정례를 연결할 자리입니다.",
        },
        {
          court: "대법원",
          caseNo: "예시 — 실제 사건번호로 교체 필요",
          title: "법관의 재판상 직무행위와 책임",
          summary: "재판 작용에 대한 책임 추궁의 한계를 다룬 판례를 연결할 자리입니다.",
        },
      ],
      reviewedAt: "2026-08-20",
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
    analysis: {
      whatItIs:
        "인터넷에 올라온 정보가 허위라고 판단되면 사업자가 먼저 가려 두도록 하고, 따르지 않으면 과징금을 물리는 법입니다.",
      whyMade:
        "공식 제안이유에는 허위정보로 인한 피해가 늘고 있는데 현행 제도로는 빠르게 차단하기 어렵다고 적혀 있습니다.",
      coreIssue:
        "무엇이 ‘허위’인지 국가나 사업자가 사전에 판단해 차단하는 구조가 검열 금지·표현의 자유와 충돌하는지가 쟁점입니다.",
      keywords: ["표현의 자유", "사전검열 금지", "명확성원칙"],
      conflictLevel: "HIGH",
      articleIds: ["art-21", "art-37", "art-10"],
      principleIds: ["pr-speech", "pr-censorship", "pr-clarity", "pr-proportion"],
      argumentsAgainst: [
        "헌법 제21조 제2항은 언론·출판에 대한 허가나 검열을 인정하지 않는다. 게시 이후라도 국가가 정한 기준으로 사업자가 일괄 차단하도록 강제하면 사실상 사전억제로 기능할 수 있다.",
        "‘허위의 정보’는 사실과 의견, 과장과 오류가 뒤섞인 영역이다. 판단 기준이 불명확하면 사업자는 제재를 피하려고 합법적인 표현까지 과도하게 지우는 위축효과가 생긴다.",
        "과징금이라는 강한 제재로 사업자에게 판단 의무를 떠넘기는 방식이 목적 달성에 필요한 최소한인지(헌법 제37조 제2항) 다툴 수 있다.",
      ],
      argumentsFor: [
        "명백한 허위사실에 의한 명예훼손·사기 피해로부터 개인을 보호하는 것은 헌법 제10조가 요구하는 국가의 기본권 보호의무의 이행으로 볼 수 있다.",
        "허위 여부가 명백하고 피해가 급박한 경우로 요건을 좁히고 이의신청·복원 절차를 두면, 표현의 자유 제한을 최소화하면서 목적을 달성할 수 있다.",
        "표현의 자유도 무제한이 아니며, 타인의 권리를 침해하는 표현에 대한 규제는 헌법 제37조 제2항이 예정한 법률유보의 범위 안에 있을 수 있다.",
      ],
      cases: [
        {
          court: "헌법재판소",
          caseNo: "예시 — 실제 사건번호로 교체 필요",
          title: "검열금지 원칙의 적용 요건",
          summary: "행정권이 주체가 된 사전심사에 해당하는지 판단한 결정례를 연결할 자리입니다.",
        },
      ],
      reviewedAt: "2026-08-19",
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
    analysis: {
      whatItIs:
        "일정 규모 이상 집회를 열 때 미리 알려야 할 내용을 늘리고, 신고와 다르게 진행되면 해산할 수 있는 요건을 구체화하는 법입니다.",
      whyMade: "공식 제안이유에는 주요 도로 집회로 인한 교통 불편 민원이 계속되고 있다고 적혀 있습니다.",
      coreIssue:
        "신고 의무가 넓어질수록 허가제에 가까워질 수 있다는 점, 해산 요건의 판단 여지가 넓다는 점이 쟁점입니다.",
      keywords: ["집회의 자유", "과잉금지원칙", "명확성원칙"],
      conflictLevel: "MEDIUM",
      articleIds: ["art-21", "art-37"],
      principleIds: ["pr-speech", "pr-proportion", "pr-clarity"],
      argumentsAgainst: [
        "헌법 제21조 제2항은 집회에 대한 허가를 인정하지 않는다. 신고사항이 지나치게 확대되어 사실상 수리를 받아야 열 수 있는 구조가 되면 허가제와 다름없다는 지적이 가능하다.",
        "‘신고 내용과 다르게 진행된 경우’의 범위가 넓으면, 경미한 변경까지 해산 사유가 되어 집회의 자유를 필요 이상으로 제한할 수 있다.",
      ],
      argumentsFor: [
        "교통 소통과 공공의 안전은 헌법 제37조 제2항이 정한 질서유지에 해당하는 공익이며, 신고제 자체는 허가제와 구별되는 제도로 인정되어 왔다.",
        "해산 요건을 구체적으로 규정하는 것은 오히려 현장의 자의적 판단을 줄여 명확성을 높이는 방향일 수 있다.",
      ],
      cases: [
        {
          court: "헌법재판소",
          caseNo: "예시 — 실제 사건번호로 교체 필요",
          title: "집회의 자유와 신고제의 한계",
          summary: "신고제가 허가제로 변질되었는지 심사한 결정례를 연결할 자리입니다.",
        },
      ],
      reviewedAt: "2026-08-15",
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
    analysis: {
      whatItIs:
        "온라인 플랫폼이 입점 사업자에게 받는 수수료의 산정 기준을 공개하고, 계약서에 꼭 넣어야 할 내용을 정하는 법입니다.",
      whyMade:
        "공식 제안이유에는 플랫폼과 입점사업자 사이의 협상력 차이 때문에 불공정거래 우려가 있다고 적혀 있습니다.",
      coreIssue:
        "영업의 자유·재산권을 어느 정도까지 제한할 수 있는지, 규제 대상 사업자 범위가 합리적으로 구분되었는지가 쟁점입니다.",
      keywords: ["직업의 자유", "재산권", "평등원칙"],
      conflictLevel: "MEDIUM",
      articleIds: ["art-15", "art-23", "art-11", "art-37"],
      principleIds: ["pr-proportion", "pr-equality"],
      argumentsAgainst: [
        "수수료 산정기준 공개 의무는 영업비밀에 해당할 수 있는 정보의 공개를 강제하는 측면이 있어 직업의 자유(헌법 제15조)와 재산권(제23조) 제한 문제가 제기될 수 있다.",
        "규제 대상을 매출·이용자 수 기준으로 나눌 경우, 경계선 부근 사업자 간 차별이 합리적인지 평등원칙 심사가 필요하다.",
      ],
      argumentsFor: [
        "거래 상대방 보호와 공정한 경쟁질서 확립은 헌법 제119조 제2항이 예정한 경제규제의 목적에 해당한다.",
        "가격 자체를 직접 통제하지 않고 산정기준의 투명성만 요구하는 방식은 제한의 정도가 상대적으로 낮아 과잉금지원칙을 통과할 가능성이 있다.",
      ],
      cases: [
        {
          court: "헌법재판소",
          caseNo: "예시 — 실제 사건번호로 교체 필요",
          title: "직업수행의 자유 제한에 대한 심사강도",
          summary: "직업선택과 직업수행을 구분해 심사강도를 달리한 결정례를 연결할 자리입니다.",
        },
      ],
      reviewedAt: "2026-07-30",
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
    analysis: {
      whatItIs:
        "특정 범죄로 처벌받은 사람이 일정 기간 관련 기관에 취업하지 못하도록 제한하는 법입니다.",
      whyMade: "공식 제안이유에는 재범을 막고 이용자를 보호하기 위한 것이라고 적혀 있습니다.",
      coreIssue:
        "헌법재판소가 제한기간을 일률적으로 정한 부분에 대해 헌법불합치로 판단했습니다. 개정 시한까지는 현행 조항이 그대로 적용됩니다.",
      keywords: ["직업의 자유", "과잉금지원칙", "평등원칙"],
      conflictLevel: "INCOMPATIBLE",
      articleIds: ["art-15", "art-37", "art-11"],
      principleIds: ["pr-proportion", "pr-equality"],
      argumentsAgainst: [
        "범죄의 경중이나 재범 위험성을 개별적으로 따지지 않고 모든 대상자에게 같은 기간을 적용하면, 필요한 정도를 넘는 제한이 되어 직업의 자유를 과도하게 침해할 수 있다.",
        "형 집행이 끝난 뒤에도 장기간 취업을 막는 것은 사실상 추가적인 불이익으로 기능한다는 지적이 가능하다.",
      ],
      argumentsFor: [
        "취약한 이용자를 보호하려는 입법목적은 정당하고, 취업제한은 형벌이 아니라 장래의 위험을 막기 위한 보안적 조치로 볼 수 있다.",
        "제한 대상 기관을 한정하고 기간을 두어 종신 제한이 아니라는 점에서 침해의 최소성을 인정할 여지가 있다.",
      ],
      cases: [
        {
          court: "헌법재판소",
          caseNo: "예시 — 실제 사건번호로 교체 필요",
          title: "일률적 취업제한 조항에 대한 헌법불합치 결정",
          summary:
            "재범 위험성에 대한 개별 심사 없이 일률적으로 기간을 정한 부분이 침해의 최소성에 반한다고 본 취지의 결정례를 연결할 자리입니다.",
        },
      ],
      reviewedAt: "2026-07-01",
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
    analysis: {
      whatItIs: "국회의원 선거구를 어떤 기준과 절차로 나눌지를 법률에 더 구체적으로 정하는 법입니다.",
      whyMade: "공식 제안이유에는 선거구마다 인구 차이가 커서 한 표의 가치가 달라지는 문제가 있다고 적혀 있습니다.",
      coreIssue: "표의 등가성(한 표의 가치가 같아야 한다는 원칙)을 어느 정도까지 맞추어야 하는지가 쟁점입니다.",
      keywords: ["선거권", "평등원칙", "국민대표성"],
      conflictLevel: "LOW",
      articleIds: ["art-24", "art-11", "art-40"],
      principleIds: ["pr-equality", "pr-representation"],
      argumentsAgainst: [
        "획정 기준을 지나치게 경직적으로 고정하면 지역 대표성이나 생활권을 반영하기 어려워 오히려 국민대표성을 왜곡할 수 있다는 지적이 가능하다.",
      ],
      argumentsFor: [
        "인구편차를 줄여 표의 가치를 맞추는 것은 헌법 제11조 평등원칙과 제24조 선거권 보장에 부합하는 방향이다.",
        "획정 기준을 법률로 명확히 하면 매 선거마다 반복되는 자의적 획정 논란을 줄일 수 있다.",
      ],
      cases: [
        {
          court: "헌법재판소",
          caseNo: "예시 — 실제 사건번호로 교체 필요",
          title: "국회의원 선거구 인구편차 기준",
          summary: "선거구 간 허용 인구편차 기준을 제시한 결정례를 연결할 자리입니다.",
        },
      ],
      reviewedAt: "2026-08-18",
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
    analysis: {
      whatItIs:
        "공공기관이 정보공개 요청을 거부할 수 있는 사유를 좁히고, 일부라도 공개할 수 있으면 공개하도록 하는 법입니다.",
      whyMade: "공식 제안이유에는 비공개 결정 사유가 지나치게 포괄적으로 쓰이고 있다는 지적이 있다고 적혀 있습니다.",
      coreIssue: "국민의 알 권리를 넓히는 방향이지만, 개인정보·국가안전보장과의 조화가 쟁점입니다.",
      keywords: ["알 권리", "개인정보", "명확성원칙"],
      conflictLevel: "LOW",
      articleIds: ["art-21", "art-10", "art-37"],
      principleIds: ["pr-speech", "pr-clarity"],
      argumentsAgainst: [
        "공개 범위가 넓어지면 제3자의 개인정보나 영업비밀이 함께 노출될 위험이 있어, 보호조치가 충분한지 검토가 필요하다.",
      ],
      argumentsFor: [
        "알 권리는 헌법 제21조에서 도출되는 기본권으로 인정되어 왔으며, 비공개 사유를 구체화하는 것은 그 보장을 강화하는 방향이다.",
        "부분공개 원칙을 명시하면 전부 비공개로 처리하던 관행을 줄일 수 있다.",
      ],
      cases: [
        {
          court: "헌법재판소",
          caseNo: "예시 — 실제 사건번호로 교체 필요",
          title: "알 권리의 헌법적 근거",
          summary: "알 권리를 헌법 제21조에서 도출한 결정례를 연결할 자리입니다.",
        },
      ],
      reviewedAt: "2026-08-10",
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
