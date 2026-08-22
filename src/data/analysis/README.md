# 헌법 분석(ANALYSIS) 오버라이드

`index.json` 은 **의안 slug 또는 의안번호 → BillAnalysis** 매핑입니다.
공식 API 로 수집한 법안에는 FACT 만 들어 있고, 쉬운 요약과 헌법쟁점은 여기에 사람이 작성해 넣습니다.

이 파일에 항목이 없는 법안은 사이트에서 **“헌법 분석 준비 중”** 으로 표시되며, 충돌등급을 부여하지
않습니다. 제작서 §3.B / §30 에 따라 분석을 자동 생성하지 않기 위한 구조입니다.

## 형식

```json
{
  "2200101": {
    "whatItIs": "1~2줄, 법률용어 없이. 평가를 섞지 않는다.",
    "whyMade": "공식 제안이유를 쉬운 말로. 추측하지 않는다.",
    "coreIssue": "핵심 헌법쟁점 1~2줄.",
    "keywords": ["사법독립", "명확성원칙"],
    "conflictLevel": "HIGH",
    "articleIds": ["art-103", "art-106"],
    "principleIds": ["pr-judicial", "pr-clarity"],
    "argumentsAgainst": ["위헌 측 논거 …"],
    "argumentsFor": ["합헌 측 논거 …"],
    "cases": [
      {
        "court": "헌법재판소",
        "caseNo": "2020헌가00",
        "title": "…",
        "summary": "…",
        "url": "https://search.ccourt.go.kr/…"
      }
    ],
    "reviewedAt": "2026-08-20"
  }
}
```

`articleIds` / `principleIds` 에 쓸 수 있는 값은 [`../constitution.ts`](../constitution.ts) 를
참고하세요.

## 작성 규칙

- 헌법재판소가 판단하기 전에는 `conflictLevel` 을 `"VOID"` 로 두지 않습니다.
- `argumentsFor` 는 비워 두지 않습니다. 가장 강한 합헌 논거도 같은 비중으로 적습니다.
- 판례는 실제 사건번호와 공식 원문 링크가 확인된 것만 넣습니다.
