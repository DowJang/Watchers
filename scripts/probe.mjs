#!/usr/bin/env node
/**
 * 공식 API 연결 점검 스크립트.
 *
 *   npm run sync:probe
 *
 * 인증키가 유효한지, 서비스 ID 가 맞는지, 실제 응답 필드명이 무엇인지 출력한다.
 * 매핑(scripts/lib/map.mjs)의 후보 필드명을 실데이터에 맞춰 조정할 때 사용한다.
 */

import { SERVICES, fetchPage } from "./lib/assembly.mjs";
import { searchLaw } from "./lib/lawgokr.mjs";

const ok = (s) => `\x1b[32m${s}\x1b[0m`;
const bad = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[90m${s}\x1b[0m`;

async function probeAssembly(label, service) {
  process.stdout.write(`\n[열린국회정보] ${label}  ${dim(service)}\n`);
  try {
    const { rows, total } = await fetchPage(service, { pSize: 2 });
    if (rows.length === 0) {
      console.log(`  ${bad("응답은 왔지만 데이터가 없습니다.")} (total=${total})`);
      return;
    }
    console.log(`  ${ok("연결 성공")}  총 ${total.toLocaleString("ko-KR")}건`);
    console.log(`  필드: ${Object.keys(rows[0]).join(", ")}`);
    console.log(dim(`  샘플: ${JSON.stringify(rows[0]).slice(0, 400)}`));
  } catch (e) {
    console.log(`  ${bad("실패")} ${e.message}`);
  }
}

async function probeLaw() {
  process.stdout.write(`\n[국가법령정보센터] 법령 검색\n`);
  try {
    const rows = await searchLaw("정보통신망", { display: 2 });
    if (rows.length === 0) {
      console.log(`  ${bad("결과 없음")}`);
      return;
    }
    console.log(`  ${ok("연결 성공")}`);
    console.log(`  필드: ${Object.keys(rows[0]).join(", ")}`);
    console.log(dim(`  샘플: ${JSON.stringify(rows[0]).slice(0, 400)}`));
  } catch (e) {
    console.log(`  ${bad("실패")} ${e.message}`);
  }
}

console.log("감시자들 — 공식 API 연결 점검");
console.log(dim(`ASSEMBLY_API_KEY ${process.env.ASSEMBLY_API_KEY ? "설정됨" : "없음"} / LAW_GO_KR_OC ${process.env.LAW_GO_KR_OC ? "설정됨" : "없음"}`));

await probeAssembly("의안정보", SERVICES.bills);
await probeAssembly("본회의 표결정보", SERVICES.votes);
await probeAssembly("국회의원 인적사항", SERVICES.members);
await probeLaw();

console.log(`\n${dim("서비스 ID 가 틀렸다면 ASSEMBLY_SVC_BILLS / ASSEMBLY_SVC_VOTES / ASSEMBLY_SVC_MEMBERS 로 덮어쓸 수 있습니다.")}`);
