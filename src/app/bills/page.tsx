import type { Metadata } from "next";
import { BillBrowser } from "@/components/BillBrowser";
import { allBills } from "@/lib/site";
import type { BillStatus, ConflictLevel } from "@/lib/types";
import { conflictOrder, statusOrder } from "@/lib/labels";

export const metadata: Metadata = {
  title: "법안",
  description: "국회에 발의된 법안을 헌법쟁점 기준으로 살펴봅니다.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function BillsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const levelRaw = one(sp.level);
  const statusRaw = one(sp.status);
  const sortRaw = one(sp.sort);

  const level = conflictOrder.includes(levelRaw as ConflictLevel) ? (levelRaw as ConflictLevel) : undefined;
  const status = statusOrder.includes(statusRaw as BillStatus) ? (statusRaw as BillStatus) : undefined;
  const sort =
    sortRaw === "recent" || sortRaw === "opinion" || sortRaw === "gravity" ? sortRaw : undefined;

  return (
    <>
      <header className="pb-1 pt-2">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">법안</h1>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-dim">
          각 카드에는 무슨 법인지, 헌법과 무엇이 부딪히는지, 누가 발의했고 어떻게 표결됐는지가 함께
          표시됩니다.
        </p>
      </header>

      <BillBrowser
        bills={allBills()}
        initialLevel={level}
        initialStatus={status}
        initialSort={sort}
      />
    </>
  );
}
