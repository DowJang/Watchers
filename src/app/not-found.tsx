import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-black" style={{ color: "var(--text-3)" }}>
        404
      </p>
      <h1 className="mt-3 text-xl font-extrabold">요청하신 페이지를 찾을 수 없습니다.</h1>
      <p className="mt-2 text-[0.9375rem] text-dim">
        주소가 변경되었거나 삭제된 페이지일 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-xl px-4 py-2.5 text-sm font-bold"
        style={{ background: "var(--color-fact)", color: "#fff" }}
      >
        홈으로 가기
      </Link>
    </div>
  );
}
