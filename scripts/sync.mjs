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
 *  - 쉬운 요약 / 헌법쟁점(ANALYSIS)은 자동 생성하지 않는다. 사람이 작성해 analysis 오버라이드에
 *    넣기 전까지 해당 법안은 "분석 준비 중"으로 표시된다.
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
const ANALYSIS_DIR = join(ROOT, "src", "data", "analysis");

/** 수집 범위 — 최근 N일 이내 발의/변경 의안 */
const WINDOW_DAYS = Number(process.env.SYNC_WINDOW_DAYS ?? 120);
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
    const { rows, params } = await fetchAllTrying(
      SERVICES.bills,
      [{ AGE }, { AGE, ORD: AGE }, { DAESU: AGE }, { UNIT_CD: `1000${AGE}` }, {}],
      { pSize: 100, maxPages: 20 },
    );
    note("info", `의안 API 파라미터: ${JSON.stringify(params)}`);
    const since = daysAgoIso(WINDOW_DAYS);
    const mapped = rows.map(mapBill).filter(Boolean);
    bills = mapped.filter((b) => !b.fact.proposal.proposedAt || b.fact.proposal.proposedAt >= since);
    note("info", `의안 ${mapped.length}건 중 최근 ${WINDOW_DAYS}일 ${bills.length}건 채택`);
    if (rows[0]) note("info", `의안 응답 필드: ${Object.keys(rows[0]).join(", ")}`);
  } catch (e) {
    note("error", `의안 수집 실패: ${e.message}`);
  }

  // ── 3. 본회의 표결정보 ─────────────────────────────────
  // 이 서비스는 의안 단위 조회를 요구하는 경우가 있어, 일괄 조회가 막히면 의안별로 돈다.
  let voteMap = new Map();
  try {
    const { rows, params } = await fetchAllTrying(
      SERVICES.votes,
      [{ AGE }, { AGE, ORD: AGE }, {}],
      { pSize: 300, maxPages: 20 },
    );
    note("info", `표결 API 파라미터: ${JSON.stringify(params)}`);
    voteMap = mapVotes(rows);
    if (rows[0]) note("info", `표결 응답 필드: ${Object.keys(rows[0]).join(", ")}`);
    note("info", `표결 기록 ${voteMap.size}건 수집`);
  } catch (e) {
    note("warn", `표결 일괄 수집 실패, 의안별 조회로 전환: ${e.message}`);
    voteMap = await fetchVotesPerBill(bills);
  }

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

  // ── 6. 사람이 작성한 ANALYSIS 병합 ─────────────────────
  const analysisIndex = await readJsonIfExists(join(ANALYSIS_DIR, "index.json"), {});
  let analyzed = 0;
  for (const bill of bills) {
    const a = analysisIndex[bill.id] ?? analysisIndex[bill.officialKeys.billNo];
    if (a) {
      bill.analysis = a;
      analyzed += 1;
    } else {
      bill.analysis = null; // 화면에서 "헌법 분석 준비 중"으로 표시
    }
  }
  note("info", `헌법 분석 연결 ${analyzed}건 / 미작성 ${bills.length - analyzed}건`);

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
  const targets = bills.filter((b) => b.fact.events.some((e) => e.label.includes("본회의")));
  const limit = Number(process.env.SYNC_VOTE_LOOKUP_LIMIT ?? 120);
  const merged = [];
  let failed = 0;

  for (const bill of targets.slice(0, limit)) {
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

  note(
    failed === targets.length && targets.length > 0 ? "error" : "info",
    `의안별 표결 조회 ${targets.length}건 대상 / 실패 ${failed}건`,
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
