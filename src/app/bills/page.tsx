import type { Metadata } from "next";
import { BillBrowser } from "@/components/BillBrowser";
import { allBills } from "@/lib/site";

export const metadata: Metadata = {
  title: "법안",
  description: "국회에 발의된 법안을 헌법쟁점 기준으로 살펴봅니다.",
};

/**
 * 정적 사이트이므로 서버에서 쿼리스트링을 읽지 않는다.
 * 초기 필터(?level=HIGH 등)는 BillBrowser 가 브라우저에서 직접 읽는다.
 */
export default function BillsPage() {
  return (
    <>
      <header className="pb-1 pt-2">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">법안</h1>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-dim">
          각 카드에는 무슨 법인지, 헌법과 무엇이 부딪히는지, 누가 발의했고 어떻게 표결됐는지가 함께
          표시됩니다.
        </p>
      </header>

      <BillBrowser bills={allBills()} />
    </>
  );
}
