import type { NextConfig } from "next";

/**
 * 정적 사이트로 빌드해 GitHub Pages 에 배포한다.
 *
 * - output: "export"  → 서버 없이 HTML/JS 파일만 생성한다.
 * - basePath          → github.io/<repo> 하위 경로 대응. 도메인 연결 후에는 빈 값으로 둔다.
 *                       (워크플로에서 NEXT_PUBLIC_BASE_PATH 로 주입)
 * - trailingSlash     → Pages 가 /bills/ 를 /bills/index.html 로 찾도록 한다.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
