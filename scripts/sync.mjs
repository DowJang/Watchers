#!/usr/bin/env node
/**
 * 공식 국가기록 동기화 (제작서 §24).
 *
 *   npm run sync
 *
 * GitHub Actions 가 매일 00:00 KST 에 실행하고, 결과 JSON 을 저장소에 커밋한다.
 * 커밋이 생기면 Pages 배포 워크플로가 다시 돌아 사이트가 갱신된다.
 * 즉 서버 없이도 "일 1회 정기 동기화 + 정적 배포" 구조가 성립한다.
 *
 * 원칙
 *  - 공식 응답에 없는 값은 만들어 넣지 않는다. 없으면 비워 두고 화면에서 "확인 필요"로 표시한다.
 *  - 쉬운 요약(whatItIs/whyMade)은 자동 생성하지 않는다. 사람이 작성해 summaries 오버라이드에
 *    넣기 전까지 해당 법안은 "쉬운 요약 준비 중"으로 표시된다.
 *  - 위헌 여부에 대한 판단·등급·논거는 만들지 않는다. 이 사이트가 표시하는 유일한 헌법 판단은
 *    공식 응답의 courtStatus/courtCaseNo 뿐이다.
 *  - 인증키가 없으면 아무것도 덮어쓰지 않고 종료한다(기존 예시 데이터 유지).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SERVICES, fetchAll, fetchAllTrying } from "./lib/assembly.mjs";
import { searchLaw } from "./lib/lawgokr.mjs";
import { mapBill, mapLegislator, mapVotes, slug, toIsoDate } from "./lib/map.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src", "data", "official");
const SUMMARIES_DIR = join(ROOT, "src", "data", "summaries");

/**
 * 수집 범위 — 최근 N일 이내 발의된 의안.
 *
 * 120일로 뒀더니 "가결/부결까지 간 의안이 0건"이었다. 국회 의안은 발의부터 본회의 표결까지
 * 보통 몇 달~1년 넘게 걸리므로, 120일 창은 아직 위원회에 머물러 있는 의안만 잡히고
 * 표결·공포·시행 데이터가 있는 의안은 전부 걸러진다(실제로 4500건을 훑어야 '가결' 사례가
 * 나왔다). 그래서 한 국회 임기 주기를 넉넉히 덮도록 기본값을 450일로 올렸다.
 */
const WINDOW_DAYS = Number(process.env.SYNC_WINDOW_DAYS ?? 450);
/**
 * 대수. 열린국회정보의 의안·표결 서비스는 대수를 필수로 요구한다.
 * 2024-05-30 개원한 제22대 국회가 기본값이며, SYNC_AGE 로 바꿀 수 있다.
 */
const AGE = process.env.SYNC_AGE || "22";

const log = [];
function note(level, message, extra) {
  const line = { at: new Date().toISOString(), level, message, ...extra };
  log.push(line);
  const tag = level === "error" ? "✕" : level === "warn" ? "!" : "·";
  console.log(`${tag} ${message}`);
}

async function writeJson(name, value) {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJsonIfExists(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function todayIso() {
  // Actions 는 UTC 로 돌기 때문에 KST 기준 날짜로 환산한다.
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000 - days * 86400000);
  return kst.toISOString().slice(0, 10);
}

async function main() {
  const startedAt = new Date().toISOString();

  if (!process.env.ASSEMBLY_API_KEY) {
    note("warn", "ASSEMBLY_API_KEY 가 없어 동기화를 건너뜁니다. 기존 데이터를 그대로 둡니다.");
    await writeSyncLog({ startedAt, status: "skipped" });
    return;
  }

  // ── 1. 국회의원 인적사항 ────────────────────────────────
  let legislators = [];
  try {
    const rows = await fetchAll(SERVICES.members, { pSize: 300, maxPages: 5 });
    legislators = rows.map(mapLegislator).filter(Boolean);
    note("info", `국회의원 ${legislators.length}명 수집`);
  } catch (e) {
    note("error", `국회의원 수집 실패: ${e.message}`);
  }

  const byName = new Map(legislators.map((l) => [l.name, l]));
  const parties = [...new Set(legislators.map((l) => l.partyName))]
    .filter(Boolean)
    .map((name) => ({ id: slug(name), name, color: partyColor(name) }));

  // ── 2. 의안정보 ────────────────────────────────────────
  // 서비스마다 필수 파라미터 이름이 달라 후보 조합을 순서대로 시도한다.
  let bills = [];
  try {
    // pSize·maxPages 는 WINDOW_DAYS 를 넉넉히 덮을 수 있게 잡는다.
    // (22대 전체 18,862 건 / 약 815 일 ≈ 하루 23 건 페이스 기준 여유 있게 계산)
    const maxRows = Math.ceil((WINDOW_DAYS / 815) * 18862 * 1.4);
    const pSize = 300;
    const maxPages = Math.max(20, Math.ceil(maxRows / pSize));
    const { rows, params } = await fetchAllTrying(
      SERVICES.bills,
      [{ AGE }, { AGE, ORD: AGE }, { DAESU: AGE }, { UNIT_CD: `1000${AGE}` }, {}],
      { pSize, maxPages },
    );
    note("info", `의안 API 파라미터: ${JSON.stringify(params)} (요청 상한 ${maxRows}건)`);
    const since = daysAgoIso(WINDOW_DAYS);
    const mapped = rows.map(mapBill).filter(Boolean);
    bills = mapped.filter((b) => !b.fact.proposal.proposedAt || b.fact.proposal.proposedAt >= since);

    // 응답이 최신순으로 오는 것을 전제로, "행 개수가 상한에 닿았다"만으로는 창이 잘렸는지
    // 알 수 없다 — 이미 창 경계를 넘어선 오래된 행까지 받았다면 창 자체는 온전하다.
    // 실제로 창이 잘렸는지는 "가장 오래된 응답 행이 아직도 창 안쪽 날짜인가"로 판단한다.
    const oldestFetchedDate = mapped
      .map((b) => b.fact.proposal.proposedAt)
      .filter(Boolean)
      .sort()[0];
    if (rows.length >= maxRows && oldestFetchedDate && oldestFetchedDate >= since) {
      note(
        "warn",
        `의안 응답이 요청 상한(${maxRows}건)에 닿았고, 가장 오래된 응답(${oldestFetchedDate})도 ` +
          `아직 ${WINDOW_DAYS}일 창 안쪽이다 — 창을 다 못 덮었을 수 있음. maxRows 배수를 올리세요.`,
      );
    }
    note("info", `의안 ${mapped.length}건 중 최근 ${WINDOW_DAYS}일 ${bills.length}건 채택`);
    if (rows[0]) note("info", `의안 응답 필드: ${Object.keys(rows[0]).join(", ")}`);
  } catch (e) {
    note("error", `의안 수집 실패: ${e.message}`);
  }

  // ── 3. 본회의 표결정보 ─────────────────────────────────
  // "국회의원 본회의 표결정보"(nojepdqqaweusdfbi) 서비스는 BILL_ID 가 필수 인자다.
  // (참고로 "의안별 표결현황"이라는 비슷한 이름의 다른 서비스가 있는데, 그건 의원별 표결이
  //  아니라 의안당 찬반 합계만 준다 — 처음에 이걸 잘못 골라 표결이 항상 0건으로 나왔었다.)
  // 필수 인자라 일괄 조회 자체가 불가능하므로 바로 의안별로 조회한다.
  const voteMap = await fetchVotesPerBill(bills);

  // ── 4. 공포·시행 보강 (선택) ───────────────────────────
  //
  // 국가법령정보센터 API 는 호출하는 서버의 고정 IP/도메인 등록을 요구한다.
  // GitHub Actions 러너는 IP 가 매번 바뀌므로 여기서는 사실상 쓸 수 없다.
  // 기본 경로는 국회 의안정보의 공포·시행 날짜 필드이며(map.mjs),
  // 아래는 고정 IP 를 가진 환경에서 돌릴 때만 동작하는 보강 경로다.
  const today = todayIso();
  if (process.env.LAW_GO_KR_OC) {
    for (const bill of bills.slice(0, Number(process.env.SYNC_LAW_LOOKUP_LIMIT ?? 40))) {
      try {
        const found = await searchLaw(bill.fact.title.replace(/\s*일부개정법률안$|\s*법률안$/, ""), {
          display: 1,
        });
        const row = found[0];
        if (!row) continue;
        bill.fact.promulgatedAt =
          toIsoDate(row["공포일자"] ?? row.promulgationDate) ?? bill.fact.promulgatedAt;
        bill.fact.effectiveAt =
          toIsoDate(row["시행일자"] ?? row.enforcementDate) ?? bill.fact.effectiveAt;
        const link = row["법령상세링크"];
        if (link) {
          bill.fact.sources.push({
            agency: "국가법령정보센터",
            label: "법률 본문",
            url: link.startsWith("http") ? link : `https://www.law.go.kr${link}`,
          });
        }
      } catch (e) {
        note("warn", `법령 조회 실패(${bill.fact.title}): ${e.message}`);
      }
    }
  } else {
    const withDates = bills.filter((b) => b.fact.promulgatedAt).length;
    note("info", `공포일 확보 ${withDates}건 (국회 의안정보 기준)`);
  }

  // ── 5. 결합 ────────────────────────────────────────────
  const totalMembers = legislators.length;
  for (const bill of bills) {
    // 발의자 이름 → 의원 id
    const sponsor = byName.get(bill.fact.proposal.sponsorName ?? "");
    bill.fact.proposal.sponsorId = sponsor?.id;
    bill.fact.proposal.coSponsorIds = bill.fact.proposal.coSponsorNames
      .map((nm) => byName.get(nm)?.id)
      .filter(Boolean);

    // 표결 4분류. 불참은 "명단에 없는 나머지"이므로 전체 의원에서 뺀다.
    const v = voteMap.get(bill.officialKeys.billId);
    if (v) {
      const idOf = (m) => byName.get(m.name)?.id;
      const forIds = v.FOR.map(idOf).filter(Boolean);
      const againstIds = v.AGAINST.map(idOf).filter(Boolean);
      const abstainIds = v.ABSTAIN.map(idOf).filter(Boolean);
      const voted = new Set([...forIds, ...againstIds, ...abstainIds]);
      const absentIds =
        v.ABSENT.length > 0
          ? v.ABSENT.map(idOf).filter(Boolean)
          : legislators.map((l) => l.id).filter((id) => !voted.has(id));

      bill.fact.vote = {
        date: v.date ?? "",
        sessionLabel: v.sessionLabel || "본회의",
        result: forIds.length > againstIds.length ? "가결" : "부결",
        for: forIds,
        against: againstIds,
        abstain: abstainIds,
        absent: absentIds,
      };
      if (totalMembers > 0 && v.ABSENT.length === 0) {
        bill.fact.voteAbsentInferred = true; // 화면에서 "명단 미공개분 추정"으로 고지
      }
    }

    bill.fact.status = deriveStatus(bill, today);
    delete bill.fact.proposal.sponsorName;
    delete bill.fact.proposal.coSponsorNames;
  }

  // ── 6. 사람이 작성한 쉬운 요약 병합 ─────────────────────
  // 위헌 여부·등급·논거는 여기서 다루지 않는다 — 그런 값 자체를 허용하지 않는다(§ summaries/README).
  const summaryIndex = await readJsonIfExists(join(SUMMARIES_DIR, "index.json"), {});
  let summarized = 0;
  for (const bill of bills) {
    const s = summaryIndex[bill.id] ?? summaryIndex[bill.officialKeys.billNo];
    if (s) {
      bill.summary = { whatItIs: s.whatItIs, whyMade: s.whyMade };
      summarized += 1;
    } else {
      bill.summary = null; // 화면에서 "쉬운 요약 준비 중"으로 표시
    }
  }
  note("info", `쉬운 요약 연결 ${summarized}건 / 미작성 ${bills.length - summarized}건`);

  // ── 7. 저장 ────────────────────────────────────────────
  await writeJson("legislators.json", { syncedAt: startedAt, parties, legislators });
  await writeJson("bills.json", { syncedAt: startedAt, bills });
  await writeJson("meta.json", {
    lastSyncedAt: startedAt,
    dataOrigin: bills.length > 0 ? "OFFICIAL" : "SAMPLE",
    counts: {
      bills: bills.length,
      legislators: legislators.length,
      withVotes: bills.filter((b) => b.fact.vote).length,
      withAnalysis: analyzed,
    },
    today: countTodayChanges(bills, today),
  });
  note("info", `동기화 완료 — 의안 ${bills.length} / 의원 ${legislators.length}`);

  // 의원·의안이 둘 다 0건이면 "오늘은 새 법안이 없었다"가 아니라 수집 자체가 실패한 것이다.
  // 이 경우 워크플로를 실패로 표시해 알아채지 못한 채 지나가지 않게 한다.
  const totalFailure = legislators.length === 0 && bills.length === 0;
  if (totalFailure) note("error", "의원·의안 모두 0건 수집 — 위 로그에서 실패 원인을 확인하세요.");

  await writeSyncLog({ startedAt, status: totalFailure ? "failed" : bills.length > 0 ? "ok" : "empty" });

  if (totalFailure) process.exitCode = 1;
}

/**
 * 표결 서비스가 의안 단위 조회만 허용할 때의 경로.
 * 본회의 의결 기록이 있는 의안만 골라 순차 조회한다(동시 호출로 차단당하지 않도록).
 */
async function fetchVotesPerBill(bills) {
  // "본회의" 라벨이 붙은 이벤트는 대안반영폐기·철회처럼 실제 표결 없이 종결된 경우도
  // 포함한다. procResult 로 실제 표결이 있었을 법한 의안만 추려 불필요한 조회를 줄인다.
  // (그래도 없는 값이면 개별 조회가 그냥 INFO-200 빈 응답으로 끝나므로 과다 필터링 위험은 낮다.)
  const NO_VOTE_RESULT = /철회|폐기$|반영폐기/;
  const targets = bills.filter(
    (b) =>
      b.fact.events.some((e) => e.label.includes("본회의")) &&
      !NO_VOTE_RESULT.test(b.fact.procResult ?? ""),
  );
  const limit = Number(process.env.SYNC_VOTE_LOOKUP_LIMIT ?? 400);
  const targeted = targets.slice(0, limit);
  const merged = [];
  let failed = 0;

  for (const bill of targeted) {
    try {
      const rows = await fetchAll(SERVICES.votes, {
        pSize: 300,
        maxPages: 3,
        params: { BILL_ID: bill.officialKeys.billId, AGE },
      });
      merged.push(...rows);
    } catch {
      failed += 1;
    }
  }

  if (targets.length > limit) {
    note(
      "warn",
      `표결 조회 대상이 한도(${limit})를 초과해 ${targets.length - limit}건을 이번 실행에서 건너뜀 (SYNC_VOTE_LOOKUP_LIMIT 로 조정 가능)`,
    );
  }
  note(
    failed === targeted.length && targeted.length > 0 ? "error" : "info",
    `의안별 표결 조회 ${targeted.length}건 시도 / 실패 ${failed}건 / 확보 ${new Set(merged.map((r) => r.BILL_ID)).size}건`,
  );
  return mapVotes(merged);
}

function deriveStatus(bill, today) {
  const { promulgatedAt, effectiveAt, procResult } = bill.fact;
  if (/폐기|철회|부결/.test(procResult ?? "")) return "DISCARDED";
  if (effectiveAt && effectiveAt <= today) return "IN_FORCE";
  if (effectiveAt) return "EFFECTIVE_SCHEDULED";
  if (promulgatedAt) return "PROMULGATED";
  if (bill.fact.vote) return "PLENARY_PASSED";
  if (/가결|통과/.test(procResult ?? "")) return "PLENARY_PASSED";
  if (bill.fact.events.some((e) => /위원회 의결/.test(e.label))) return "COMMITTEE_PASSED";
  return "PENDING";
}

/** 제작서 §25 — 오늘의 변경 */
function countTodayChanges(bills, today) {
  const on = (b, label) => b.fact.events.some((e) => e.date === today && e.label.includes(label));
  return {
    newBills: bills.filter((b) => b.fact.proposal.proposedAt === today).length,
    committeePassed: bills.filter((b) => on(b, "위원회 의결")).length,
    plenaryPassed: bills.filter((b) => on(b, "본회의 의결")).length,
    promulgated: bills.filter((b) => b.fact.promulgatedAt === today).length,
    inForce: bills.filter((b) => b.fact.effectiveAt === today).length,
    courtDecisions: 0, // 헌재는 공개 API 가 없어 별도 수집 경로가 필요하다.
  };
}

async function writeSyncLog({ startedAt, status }) {
  const previous = await readJsonIfExists(join(OUT_DIR, "sync-log.json"), { runs: [] });
  const runs = [
    { startedAt, finishedAt: new Date().toISOString(), status, entries: log },
    ...(previous.runs ?? []),
  ].slice(0, 30);
  await writeJson("sync-log.json", { runs });
}

/** 정당 표시색 — 정치적 의미 없이 목록 구분용으로만 쓴다. */
function partyColor(name) {
  const palette = ["#2f6fd0", "#c0392b", "#1f8a5b", "#7a4bbd", "#c77b1a", "#0f8a8a", "#6b7280"];
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return palette[h % palette.length];
}

main().catch(async (e) => {
  note("error", `동기화 중단: ${e.stack ?? e.message}`);
  await writeSyncLog({ startedAt: new Date().toISOString(), status: "failed" });
  process.exitCode = 1;
});
