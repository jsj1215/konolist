import type { NextConfig } from "next";

// 스크립트를 막는 엄격한 CSP는 Next 런타임과 충돌할 수 있어 넣지 않음.
// 클릭재킹 방어는 X-Frame-Options와 frame-ancestors만 사용함.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // 곡별 녹음 기능이 마이크를 쓰므로 같은 출처에만 허용함
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
