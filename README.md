# 감시자들 (Watchers)

> **누가, 왜 이 법을 만들었고 헌법과 어디에서 충돌하는가.**
>
> 대한민국 국가기관의 공식 기록만으로 입법과 헌법의 관계를 추적합니다.

- 공개 사이트 — **https://dowjang.github.io/Watchers/**
- 관리자 — **https://dowjang.github.io/Watchers/admin/**

전체 기획은 [`감시자들_웹사이트_제작서.md`](./감시자들_웹사이트_제작서.md)에 있습니다.

---

## 구조

서버를 두지 않는다. 세 조각으로 나뉜다.

```
GitHub Actions (매일 00:00 KST)
  └ 열린국회정보 · 국가법령정보센터에서 공식 기록 수집
      └ src/data/official/*.json 커밋
          └ Pages 배포 워크플로가 정적 사이트 재빌드
                                                  ← 국가기관 FACT = 일 1회

브라우저 → Supabase (Postgres + RLS)
  투표 · 코멘트 · 1,000표 Trigger · 감사로그        ← 시민 참여 = 실시간
```

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 15 App Router, `output: "export"` |
| 호스팅 | GitHub Pages (정적 파일) |
| 스타일 | Tailwind CSS v4 + CSS 변수 토큰 |
| 공식 데이터 수집 | Node 스크립트 + Actions cron |
| 시민 참여 백엔드 | Supabase (Postgres, RLS, SECURITY DEFINER 함수) |

---

## 현재 상태

세 가지가 각각 독립적으로 켜진다. 아무것도 켜지 않아도 사이트는 뜬다.

| 스위치 | 켜는 방법 | 켜지 않으면 |
|---|---|---|
| 공식 국회 데이터 | 저장소 Secret `ASSEMBLY_API_KEY` | 예시(가상) 데이터로 화면 구조만 표시 |
| 투표·코멘트·Trigger | 저장소 Variable `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저 로컬 데모 (저장 안 됨) |

### 국가법령정보센터(law.go.kr)는 쓰지 않습니다

처음에는 공포일·시행일을 국가법령정보센터 API 로 받으려 했으나, 이 API 는 **호출하는 서버의
고정 IP·도메인을 사전 등록**해야 합니다.

```
"OPEN API 호출 시 사용자 검증을 위하여 정확한 서버장비의 IP주소 및 도메인주소를 등록해 주세요."
```

GitHub Actions 러너는 실행마다 IP 가 바뀌므로 등록할 고정 IP 가 없습니다. 따라서 공포·시행일은
국회 의안정보 응답의 날짜 필드에서 직접 뽑습니다. `LAW_GO_KR_OC` 경로는 고정 IP 를 가진 환경에서
돌릴 때를 위해 코드에 남겨 두었을 뿐, 등록하지 않아도 됩니다.

### ⚠️ 예시 데이터에 대하여

제작서 §1.1 / §30 의 절대 원칙은 **“공식 기록에 없는 사실은 사실로 표시하지 않는다”**,
**“AI가 공식 FACT를 추측하여 생성하지 않는다”** 입니다.

인증키가 없는 상태에서 화면을 채우려면 실존 의원 이름에 존재하지 않는 표결 기록을 붙여야 합니다.
그것은 이 사이트가 절대 하지 말아야 할 일이므로, 대신 **누가 봐도 가짜인 정당·의원·법안**(가람당,
나루당 등)을 쓰고 헤더에 “예시 데이터 — 공식 API 연동 전”을 상시 표시합니다.
인증키를 등록하는 순간 이 데이터는 전부 실제 국회 기록으로 대체됩니다.

---

## 1. 공식 국회 데이터 켜기

### ⚠️ GitHub Actions 로는 자동 수집이 안 됩니다

열린국회정보 API 는 **GitHub Actions(해외 클라우드 IP)의 접속을 연결 단계에서 막습니다**
(`CONNECT_TIMEOUT` — 인증키와 무관, 3회 재시도해도 동일). 이 PC(국내 네트워크)에서 같은 주소로
호출하면 0.06초 만에 응답이 옵니다. 즉 코드 문제가 아니라 발신 IP 문제이며, 클라우드에서는
고칠 방법이 없습니다.

그래서 자동 수집은 **국내 네트워크에 있는 PC에서 예약 실행**하고, 결과만 GitHub 에 올리는
방식으로 바꿨습니다. 사이트 자체(정적 페이지 배포)는 지금처럼 100% GitHub Pages 이며, 이
PC가 담당하는 일은 "매일 정해진 시각에 데이터를 받아 커밋·푸시"뿐입니다.

### 설정 — 사무실 PC에서 한 번만

1. https://open.assembly.go.kr 회원가입 → 로그인 → **마이페이지 → 인증키 발급** 신청 →
   **인증키 발급내역**에서 키 확인 *(이미 완료됨)*
2. 사무실 PC의 이 저장소 폴더( Dropbox 로 동기화되는 폴더, 이 PC와 동일 경로 `C:\Dropbox\감시자들`)
   최상위에 `.env.local` 파일을 새로 만들고 한 줄만 적어 저장:
   ```
   ASSEMBLY_API_KEY=발급받은키그대로
   ```
   (이 파일은 git 에 올라가지 않습니다 — `.gitignore` 에 이미 등록되어 있습니다.)
3. `scripts\register-local-sync-task.ps1` 파일을 **우클릭 → PowerShell로 실행** — 매일 09:30
   실행되는 Windows 작업 스케줄러 항목을 등록합니다. (관리자 권한 불필요, 딱 한 번만 하면 됨)
4. 바로 테스트해 보려면 PowerShell 을 열고:
   ```powershell
   Start-ScheduledTask -TaskName "감시자들 공식데이터동기화"
   ```
   결과 로그는 `scripts\local-sync.log` 에 쌓입니다.

이후 매일 09:30 에 사무실 PC가 켜져 있고 로그인되어 있으면 자동으로 수집 → 커밋 → 푸시 →
Pages 재배포까지 이어집니다. **주의: 이 예약 작업은 사무실 PC 한 곳에만 등록하세요.** 이
폴더는 두 PC가 Dropbox 로 번갈아 쓰고 있으므로, 양쪽에 모두 등록하면 같은 시각에 두 번 실행되어
git 충돌이 날 수 있습니다.

`.github/workflows/sync.yml` 은 자동 스케줄을 껐고 수동 실행(workflow_dispatch)만 남겨
뒀습니다 — 나중에 IP 차단이 풀렸는지 다시 확인해 보고 싶을 때 쓰는 진단용입니다.

### 연결 점검

```bash
ASSEMBLY_API_KEY=... npm run sync:probe
```

인증키가 유효한지, 서비스 ID 가 맞는지, **실제 응답 필드명이 무엇인지**를 출력합니다.
열린국회정보는 서비스가 개편되면 ID·필드명이 바뀔 수 있으므로, 수집 결과가 이상하면 이 명령의
출력을 보고 [`scripts/lib/map.mjs`](./scripts/lib/map.mjs) 의 후보 필드명을 조정하면 됩니다.
서비스 ID 는 `ASSEMBLY_SVC_BILLS` / `ASSEMBLY_SVC_VOTES` / `ASSEMBLY_SVC_MEMBERS` 로 덮어쓸 수 있습니다.

### 헌법 분석은 자동 생성하지 않습니다

수집된 법안에는 FACT 만 들어 있습니다. 쉬운 요약·헌법쟁점·충돌등급은 사람이
[`src/data/analysis/index.json`](./src/data/analysis/README.md) 에 작성해 넣습니다.
작성 전까지 그 법안은 **“헌법 분석 준비 중”** 으로 표시되며 등급이 부여되지 않습니다.

---

## 2. 투표·코멘트 백엔드 켜기

1. https://supabase.com 에서 프로젝트 생성
2. **SQL Editor** 에 [`supabase/schema.sql`](./supabase/schema.sql) 전체를 붙여넣고 실행
3. **Authentication → Providers → Email** 활성화 (매직링크)
4. **Authentication → URL Configuration** 의 Site URL / Redirect URLs 에
   `https://dowjang.github.io/Watchers/` 등록
5. **Project Settings → API** 에서 Project URL 과 anon public key 복사
6. 저장소 **Settings → Secrets and variables → Actions → Variables** 탭에 등록
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. 관리자로 한 번 로그인한 뒤 SQL Editor 에서:
   ```sql
   insert into admin_users (id, email)
   select id, email from auth.users where email = '관리자이메일';
   ```

> anon key 는 공개되어도 되는 값입니다. 실제 권한은 Postgres RLS 와 SECURITY DEFINER 함수가
> 통제합니다. **service_role 키는 절대 저장소에 넣지 마세요.**

### 아직 본인확인은 연결되지 않았습니다

제작서 §9 는 본인확인 기반 인증 투표를 요구합니다. 스키마에는 자리(`voter_identities` —
본인확인 식별값을 HMAC 해시로만 보관)가 준비되어 있지만, 실제 본인확인 사업자(PASS/NICE 등)
연동은 계약이 필요하고 아직 붙지 않았습니다.

따라서 현재 집계는 **“인증된 1인 1표”가 아니라 “이메일 계정 1개당 1표”** 입니다.
1,000표 Trigger 도 이 기준으로 계산되며, 화면에도 그렇게 고지합니다.

---

## 실행

```bash
npm install
npm run dev
```

```bash
npm run build     # out/ 에 정적 파일 생성
npm run sync      # 공식 기록 수집 (키 필요)
npm run sync:probe # API 연결 점검
```

---

## 화면

| 경로 | 내용 | 제작서 |
|---|---|---|
| `/` | 오늘의 입법, 헌법충돌 주요 법안, 등급 범례, 신규·시행 법률, 오늘의 시민의견 | §25, §33 |
| `/bills` | 검색 + 충돌등급·상태 필터 + 정렬 | §4 |
| `/bills/[id]` | 쉬운 요약 → FACT → 입법경과 → 발의자 → 표결 → VS 헌법 → 공식 원문 → 시민투표 → 코멘트 | §5, §6, §8, §15 |
| `/constitution`, `/constitution/[id]` | 헌법 원문 + 쉬운 설명, 조항별 관련 법안 | §6.1, §33 |
| `/legislators`, `/legislators/[id]` | 의원별 발의·표결 기록 | §33 |
| `/transparency` | 데이터 출처, 분석 기준, 투표 집계 방식, 정정 내역 | §28 |
| `/admin` | Dashboard, 공식 데이터, 투표, Trigger, 헌재 검토, 언론 발송, 댓글, Audit Log | §17~§23, §34 |

### 설계에서 지킨 원칙

- **FACT / ANALYSIS / OPINION 완전 분리** — 타입 단계에서 세 객체로 나누고, 화면에서도 색·테두리·
  머리표시가 다른 세 종류 박스로만 렌더링합니다.
- **표결 4분류 분리** — 찬성·반대·기권·불참을 각각 별도로 보관하고, “불참은 반대로 계산하지 않습니다”
  를 명시합니다. 불참 명단이 공식 기록에 없어 재적에서 역산한 경우 그 사실을 함께 표시합니다.
- **헌재 판단 전 고지** — “헌법재판소에 의해 위헌으로 확정된 법률은 아닙니다.” 를 상세 페이지에 강조
  표시합니다.
- **없는 값은 지어내지 않습니다** — 관리자 화면의 실시간 지표도 백엔드가 없으면 숫자를 만들어 채우지
  않고 “백엔드 연결 후 표시”로 비워 둡니다.
- **모바일 우선** — 기본 1열 + 하단 탭 바, `md` 이상 헤더 내비게이션, `lg` 이상 상세 2열.
- **접근성** — 본문 건너뛰기, `aria-pressed`/`aria-current`, 다크모드, `prefers-reduced-motion`.

---

## 남은 범위

- 본인확인 사업자 연동 (§9) — 스키마 자리는 준비됨
- 1,000표 Trigger 이후 자동 처리: 보고서 PDF/HTML 생성, 언론 10곳 실제 발송(SPF/DKIM/DMARC,
  bounce tracking), 헌재 제출 검토패키지 생성 (§11~§13)
- 헌법재판소 결정·대법원 판례 수집 경로 — 공개 API 가 없어 별도 방식 필요 (§24)
- 방문 통계 수집 연결 (§18.3) — `record_page_view()` 함수는 준비됨
- 관리자 2단계 인증 (§17)

---

## 디렉터리

```
scripts/            공식 데이터 수집 (Actions 에서 실행)
supabase/schema.sql 시민 참여 백엔드 스키마
src/
├─ app/             라우트 (공개 + /admin)
├─ components/      Zone(3영역 분리), BillCard, Timeline, VoteBreakdown, admin/*
├─ data/
│  ├─ official/     ← 동기화가 채우는 공식 기록
│  ├─ analysis/     ← 사람이 쓰는 헌법 분석
│  └─ *.ts          예시 데이터 (공식 데이터가 없을 때만 사용)
└─ lib/             repo(출처 판정), types, labels, citizen(투표·코멘트), admin
```
